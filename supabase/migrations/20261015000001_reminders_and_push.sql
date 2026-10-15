-- FocusFlow Reminders, Push Subscriptions, Delivery Logs & Atomic Job Claiming

-- 1. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'claiming', 'processing', 'completed', 'failed', 'snoozed', 'expired')),
  recurrence_rule TEXT NOT NULL DEFAULT 'once' CHECK (recurrence_rule IN ('once', 'daily', 'weekdays', 'weekly', 'monthly')),
  recurrence_time_of_day TEXT, -- HH:mm (e.g. '09:00')
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  claim_token UUID,
  claim_expires_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Reminder Deliveries Table (Delivery Logs / Audit Trail)
CREATE TABLE IF NOT EXISTS public.reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  task_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_channel TEXT NOT NULL DEFAULT 'web_push' CHECK (delivery_channel IN ('web_push', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'expired', 'suppressed_quiet_hours')),
  endpoint_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for high-performance reminder querying & job claiming
CREATE INDEX IF NOT EXISTS idx_reminders_claim_due
ON public.reminders (remind_at, status)
WHERE status IN ('scheduled', 'snoozed');

CREATE INDEX IF NOT EXISTS idx_reminders_user
ON public.reminders (user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_task
ON public.reminders (task_id);

CREATE INDEX IF NOT EXISTS idx_push_subs_user
ON public.push_subscriptions (user_id)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_deliveries_user_time
ON public.reminder_deliveries (user_id, attempted_at DESC);

-- 5. Auto-update triggers
CREATE OR REPLACE TRIGGER trg_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_push_subs_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. ATOMIC JOB-CLAIMING STORED PROCEDURE (SKIP LOCKED to prevent duplicate bursts)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_due_reminders(
  p_worker_id UUID,
  p_limit INT DEFAULT 50,
  p_lease_seconds INT DEFAULT 60
)
RETURNS TABLE (
  reminder_id UUID,
  task_id TEXT,
  user_id UUID,
  task_title TEXT,
  task_description TEXT,
  task_priority TEXT,
  task_category TEXT,
  remind_at TIMESTAMPTZ,
  recurrence_rule TEXT,
  recurrence_time_of_day TEXT,
  time_zone TEXT,
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH due_batch AS (
    SELECT r.id
    FROM public.reminders r
    JOIN public.tasks t ON t.id = r.task_id
    WHERE t.completed = FALSE
      AND t.is_trash = FALSE
      AND (
        (r.status IN ('scheduled', 'snoozed') AND r.remind_at <= NOW())
        OR
        (r.status = 'claiming' AND r.claim_expires_at < NOW()) -- Deadlock / worker crash lease recovery
      )
    ORDER BY r.remind_at ASC
    LIMIT p_limit
    FOR UPDATE OF r SKIP LOCKED
  ),
  updated_batch AS (
    UPDATE public.reminders r
    SET
      status = 'claiming',
      claim_token = p_worker_id,
      claim_expires_at = NOW() + (p_lease_seconds || ' seconds')::interval,
      updated_at = NOW()
    FROM due_batch
    WHERE r.id = due_batch.id
    RETURNING r.*
  )
  SELECT
    ub.id AS reminder_id,
    ub.task_id,
    ub.user_id,
    t.title AS task_title,
    t.description AS task_description,
    t.priority AS task_priority,
    t.category AS task_category,
    ub.remind_at,
    ub.recurrence_rule,
    ub.recurrence_time_of_day,
    ub.time_zone,
    COALESCE(us.quiet_hours_enabled, FALSE) AS quiet_hours_enabled,
    COALESCE(us.quiet_hours_start, '22:00') AS quiet_hours_start,
    COALESCE(us.quiet_hours_end, '07:00') AS quiet_hours_end
  FROM updated_batch ub
  JOIN public.tasks t ON t.id = ub.task_id
  LEFT JOIN public.user_settings us ON us.user_id = ub.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;

-- push_subscriptions
CREATE POLICY "Users can manage own push subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- reminders
CREATE POLICY "Users can view own reminders"
ON public.reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
ON public.reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
ON public.reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
ON public.reminders FOR DELETE
USING (auth.uid() = user_id);

-- reminder_deliveries
CREATE POLICY "Users can view own delivery logs"
ON public.reminder_deliveries FOR SELECT
USING (auth.uid() = user_id);
