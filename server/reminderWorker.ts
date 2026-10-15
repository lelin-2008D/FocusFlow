import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import {
  computeNextOccurrence,
  isWithinQuietHours,
  isOverdueBeyondThreshold,
} from '../src/utils/recurrenceUtils'
import type { RecurrenceRule } from '../src/types/task'

export interface WorkerConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  vapidPublicKey: string
  vapidPrivateKey: string
  vapidSubject: string
}

export class ReminderWorker {
  private supabase: any
  private workerId: string
  private isConfigured = false

  constructor(config: WorkerConfig, workerId = `worker_${Date.now()}`) {
    this.workerId = workerId

    if (
      config.supabaseUrl &&
      config.supabaseServiceKey &&
      config.vapidPublicKey &&
      config.vapidPrivateKey
    ) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
      webpush.setVapidDetails(
        config.vapidSubject || 'mailto:admin@focusflow.app',
        config.vapidPublicKey,
        config.vapidPrivateKey
      )
      this.isConfigured = true
    } else {
      // Mock client for tests / dry-run environments
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
      this.isConfigured = false
    }
  }

  /**
   * Processes a single batch of due reminders with atomic claiming and idempotent push delivery
   */
  async processBatch(batchSize = 25, leaseSeconds = 60): Promise<{
    claimed: number
    delivered: number
    suppressed: number
    expired: number
    failed: number
  }> {
    const stats = { claimed: 0, delivered: 0, suppressed: 0, expired: 0, failed: 0 }
    if (!this.isConfigured) {
      return stats
    }

    try {
      // 1. Atomically claim due reminders via PostgreSQL stored procedure (FOR UPDATE SKIP LOCKED)
      const { data: claimedRows, error: claimError } = await this.supabase.rpc(
        'claim_due_reminders',
        {
          p_worker_id: this.workerId,
          p_limit: batchSize,
          p_lease_seconds: leaseSeconds,
        }
      )

      if (claimError || !claimedRows || claimedRows.length === 0) {
        return stats
      }

      stats.claimed = claimedRows.length

      // 2. Process each claimed reminder
      for (const row of claimedRows) {
        const {
          reminder_id,
          task_id,
          user_id,
          task_title,
          task_description,
          remind_at,
          recurrence_rule,
          recurrence_time_of_day,
          time_zone,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end,
        } = row

        // Check Outage Recovery / Burst Prevention (>24h overdue)
        if (isOverdueBeyondThreshold(remind_at, 24)) {
          await this.supabase
            .from('reminders')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', reminder_id)

          await this.supabase.from('reminder_deliveries').insert({
            reminder_id,
            task_id,
            user_id,
            scheduled_for: remind_at,
            delivery_channel: 'web_push',
            status: 'expired',
            error_message: 'Overdue beyond 24h threshold; suppressed to prevent notification burst',
          })

          stats.expired++
          continue
        }

        // Check Quiet Hours Suppression
        if (quiet_hours_enabled && isWithinQuietHours(new Date(), quiet_hours_start, quiet_hours_end)) {
          await this.supabase.from('reminder_deliveries').insert({
            reminder_id,
            task_id,
            user_id,
            scheduled_for: remind_at,
            delivery_channel: 'web_push',
            status: 'suppressed_quiet_hours',
            error_message: 'Suppressed during user configured quiet hours',
          })

          // Postpone status to allow redelivery after quiet hours
          await this.supabase
            .from('reminders')
            .update({ status: 'snoozed', updated_at: new Date().toISOString() })
            .eq('id', reminder_id)

          stats.suppressed++
          continue
        }

        // 3. Query active Web Push subscriptions for this user
        const { data: subscriptions } = await this.supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user_id)
          .eq('is_active', true)

        let pushDelivered = false

        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `FocusFlow: ${task_title}`,
            body: task_description || 'You have a scheduled reminder.',
            taskId: task_id,
            reminderId: reminder_id,
            tag: task_id,
          })

          for (const sub of subscriptions) {
            try {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              }

              await webpush.sendNotification(pushSubscription, payload)
              pushDelivered = true

              await this.supabase.from('reminder_deliveries').insert({
                reminder_id,
                task_id,
                user_id,
                scheduled_for: remind_at,
                delivery_channel: 'web_push',
                status: 'delivered',
                endpoint_hash: sub.endpoint.substring(0, 30) + '...',
              })
            } catch (err: any) {
              const statusCode = err?.statusCode

              // Subscription invalid or unsubscribed (404 / 410 Gone)
              if (statusCode === 404 || statusCode === 410) {
                await this.supabase
                  .from('push_subscriptions')
                  .update({ is_active: false })
                  .eq('endpoint', sub.endpoint)
              }

              await this.supabase.from('reminder_deliveries').insert({
                reminder_id,
                task_id,
                user_id,
                scheduled_for: remind_at,
                delivery_channel: 'web_push',
                status: 'failed',
                endpoint_hash: sub.endpoint.substring(0, 30) + '...',
                error_message: err?.message || 'Failed push transmission',
              })
            }
          }
        }

        // 4. Update reminder lifecycle & recurring rules
        if (recurrence_rule && recurrence_rule !== 'once') {
          const nextDate = computeNextOccurrence(
            remind_at,
            recurrence_rule as RecurrenceRule,
            recurrence_time_of_day,
            time_zone
          )

          if (nextDate) {
            await this.supabase
              .from('reminders')
              .update({
                remind_at: nextDate.toISOString(),
                status: 'scheduled',
                claim_token: null,
                claim_expires_at: null,
                retry_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', reminder_id)
          } else {
            await this.supabase
              .from('reminders')
              .update({ status: 'completed', claim_token: null })
              .eq('id', reminder_id)
          }
        } else {
          await this.supabase
            .from('reminders')
            .update({ status: 'completed', claim_token: null })
            .eq('id', reminder_id)
        }

        if (pushDelivered) {
          stats.delivered++
        } else {
          stats.failed++
        }
      }
    } catch (err) {
      console.error('Reminder worker error:', err)
    }

    return stats
  }
}
