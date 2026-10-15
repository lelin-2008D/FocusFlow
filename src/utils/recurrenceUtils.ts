import {
  addDays,
  addWeeks,
  addMonths,
  addMinutes,
  addHours,
  setHours,
  setMinutes,
  setSeconds,
  isWeekend,
  parseISO,
} from 'date-fns'
import type { RecurrenceRule } from '../types/task'

export type SnoozeDuration = '5m' | '15m' | '1h' | 'tomorrow_morning'

/**
 * Calculates the next occurrence timestamp for a recurring reminder
 */
export function computeNextOccurrence(
  currentDateOrStr: Date | string,
  rule: RecurrenceRule,
  timeOfDay?: string, // HH:mm
  _timeZone = 'UTC'
): Date | null {
  if (rule === 'once') {
    return null
  }

  const baseDate = typeof currentDateOrStr === 'string' ? parseISO(currentDateOrStr) : new Date(currentDateOrStr)
  let nextDate: Date

  switch (rule) {
    case 'daily': {
      nextDate = addDays(baseDate, 1)
      break
    }
    case 'weekdays': {
      let candidate = addDays(baseDate, 1)
      while (isWeekend(candidate)) {
        candidate = addDays(candidate, 1)
      }
      nextDate = candidate
      break
    }
    case 'weekly': {
      nextDate = addWeeks(baseDate, 1)
      break
    }
    case 'monthly': {
      nextDate = addMonths(baseDate, 1)
      break
    }
    default:
      return null
  }

  // Apply time of day if provided (e.g. "09:00")
  if (timeOfDay && /^\d{2}:\d{2}$/.test(timeOfDay)) {
    const [hours, minutes] = timeOfDay.split(':').map(Number)
    nextDate = setHours(nextDate, hours)
    nextDate = setMinutes(nextDate, minutes)
    nextDate = setSeconds(nextDate, 0)
  }

  return nextDate
}

/**
 * Calculates the snooze target timestamp from now
 */
export function computeSnooze(duration: SnoozeDuration, baseDate: Date = new Date()): Date {
  switch (duration) {
    case '5m':
      return addMinutes(baseDate, 5)
    case '15m':
      return addMinutes(baseDate, 15)
    case '1h':
      return addHours(baseDate, 1)
    case 'tomorrow_morning': {
      const tomorrow = addDays(baseDate, 1)
      return setSeconds(setMinutes(setHours(tomorrow, 9), 0), 0)
    }
  }
}

/**
 * Determines whether a given time falls within the user's configured quiet hours window.
 * Supports overnight ranges (e.g. 22:00 to 07:00).
 */
export function isWithinQuietHours(
  checkTime: Date = new Date(),
  quietStart = '22:00',
  quietEnd = '07:00'
): boolean {
  if (!quietStart || !quietEnd) return false

  const [startHour, startMin] = quietStart.split(':').map(Number)
  const [endHour, endMin] = quietEnd.split(':').map(Number)

  const currentMinutes = checkTime.getHours() * 60 + checkTime.getMinutes()
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  if (startMinutes < endMinutes) {
    // Normal window within the same day (e.g. 13:00 to 15:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Overnight window (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

/**
 * Determines whether a reminder is older than the max threshold (e.g. 24 hours).
 * Used by worker to prevent notification bursts following long offline or outage periods.
 */
export function isOverdueBeyondThreshold(
  scheduledFor: Date | string,
  thresholdHours = 24,
  now: Date = new Date()
): boolean {
  const sched = typeof scheduledFor === 'string' ? parseISO(scheduledFor) : scheduledFor
  const diffMs = now.getTime() - sched.getTime()
  return diffMs > thresholdHours * 60 * 60 * 1000
}
