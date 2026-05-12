-- MoTrack Ritual Reminder System Migration
-- Safe to run multiple times in Supabase SQL Editor.

-- Habit reminders
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS reminder_time text,
ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS reminder_sound text DEFAULT 'chime' NOT NULL,
ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

-- Project task reminders
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS reminder_time text,
ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS reminder_sound text DEFAULT 'chime' NOT NULL,
ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

-- Sleep shutdown ritual settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS sleep_reminder_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS sleep_reminder_time text,
ADD COLUMN IF NOT EXISTS sleep_reminder_days integer[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS sleep_reminder_sound text DEFAULT 'night' NOT NULL,
ADD COLUMN IF NOT EXISTS sleep_last_triggered_at timestamptz;

-- Reminder lookup indexes
CREATE INDEX IF NOT EXISTS idx_habits_reminder_enabled
ON public.habits(reminder_enabled)
WHERE reminder_enabled = true;

CREATE INDEX IF NOT EXISTS idx_project_tasks_reminder_enabled
ON public.project_tasks(reminder_enabled)
WHERE reminder_enabled = true;

-- Optional operational view for the client runtime.
CREATE OR REPLACE VIEW public.active_ritual_reminders AS
SELECT
  id,
  user_id,
  'habit'::text AS source_type,
  title,
  color,
  reminder_enabled,
  reminder_time,
  reminder_days,
  reminder_sound,
  last_triggered_at
FROM public.habits
WHERE reminder_enabled = true
  AND reminder_time IS NOT NULL
UNION ALL
SELECT
  id,
  user_id,
  'task'::text AS source_type,
  title,
  null::text AS color,
  reminder_enabled,
  reminder_time,
  reminder_days,
  reminder_sound,
  last_triggered_at
FROM public.project_tasks
WHERE reminder_enabled = true
  AND reminder_time IS NOT NULL
  AND is_done = false;

GRANT SELECT ON public.active_ritual_reminders TO authenticated;
