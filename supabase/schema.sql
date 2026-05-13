-- MoTrack complete Supabase schema
-- Run this in the Supabase SQL Editor for a brand-new project.
-- It is safe to run more than once for the same schema shape.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_habit_streak(
  p_habit_id uuid,
  p_anchor_date date default current_date
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cursor date := p_anchor_date;
  v_streak integer := 0;
begin
  if not exists (
    select 1
    from public.habit_completions
    where habit_id = p_habit_id
      and completed_on = v_cursor
  ) then
    v_cursor := v_cursor - 1;
  end if;

  while exists (
    select 1
    from public.habit_completions
    where habit_id = p_habit_id
      and completed_on = v_cursor
  ) loop
    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
  end loop;

  return v_streak;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core account tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  accent_color text not null default '#8b5cf6',
  notifications_enabled boolean not null default true,
  focus_sound boolean not null default true,
  daily_goal_minutes integer not null default 45,
  weekly_goal_habits integer not null default 5,
  sleep_reminder_enabled boolean not null default false,
  sleep_reminder_time text,
  sleep_reminder_days integer[] not null default array[]::integer[],
  sleep_reminder_sound text not null default 'night',
  sleep_last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_daily_goal_check check (daily_goal_minutes between 1 and 1440),
  constraint settings_weekly_goal_check check (weekly_goal_habits between 0 and 100),
  constraint settings_sleep_time_check check (
    sleep_reminder_time is null
    or sleep_reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint settings_sleep_days_check check (
    sleep_reminder_days <@ array[0, 1, 2, 3, 4, 5, 6]
  )
);

-- ---------------------------------------------------------------------------
-- Habits and normalized completions
-- ---------------------------------------------------------------------------

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Health',
  color text not null default '#8b5cf6',
  icon text not null default 'target',
  frequency text not null default 'daily',
  streak integer not null default 0,
  best_streak integer not null default 0,
  completed_dates text[] not null default array[]::text[],
  is_active boolean not null default true,
  reminder_enabled boolean not null default false,
  reminder_time text,
  reminder_days integer[] not null default array[]::integer[],
  reminder_sound text not null default 'chime',
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_title_not_empty check (length(btrim(title)) > 0),
  constraint habits_frequency_check check (frequency in ('daily', 'weekly', 'monthly', 'custom')),
  constraint habits_streak_check check (streak >= 0 and best_streak >= 0),
  constraint habits_reminder_time_check check (
    reminder_time is null
    or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint habits_reminder_days_check check (
    reminder_days <@ array[0, 1, 2, 3, 4, 5, 6]
  ),
  constraint habits_id_user_id_unique unique (id, user_id)
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null,
  completed_on date not null default current_date,
  completed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_completions_habit_user_fk
    foreign key (habit_id, user_id)
    references public.habits(id, user_id)
    on delete cascade,
  constraint habit_completions_unique_day unique (user_id, habit_id, completed_on)
);

-- ---------------------------------------------------------------------------
-- Projects and tasks
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz,
  status text not null default 'backlog',
  priority text not null default 'medium',
  progress integer not null default 0,
  color text not null default '#8b5cf6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_not_empty check (length(btrim(title)) > 0),
  constraint projects_status_check check (status in ('backlog', 'active', 'completed', 'on_hold')),
  constraint projects_priority_check check (priority in ('low', 'medium', 'high')),
  constraint projects_progress_check check (progress between 0 and 100),
  constraint projects_id_user_id_unique unique (id, user_id)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  title text not null,
  description text,
  is_done boolean not null default false,
  due_date timestamptz,
  position integer not null default 0,
  reminder_enabled boolean not null default false,
  reminder_time text,
  reminder_days integer[] not null default array[]::integer[],
  reminder_sound text not null default 'chime',
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_tasks_project_id_fk
    foreign key (project_id)
    references public.projects(id)
    on delete cascade,
  constraint project_tasks_title_not_empty check (length(btrim(title)) > 0),
  constraint project_tasks_position_check check (position >= 0),
  constraint project_tasks_reminder_time_check check (
    reminder_time is null
    or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint project_tasks_reminder_days_check check (
    reminder_days <@ array[0, 1, 2, 3, 4, 5, 6]
  )
);

do $$
begin
  if to_regclass('public.project_tasks') is not null then
    alter table public.project_tasks
      drop constraint if exists project_tasks_project_user_fk;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'project_tasks_project_id_fk'
        and conrelid = 'public.project_tasks'::regclass
    ) then
      alter table public.project_tasks
        add constraint project_tasks_project_id_fk
        foreign key (project_id)
        references public.projects(id)
        on delete cascade;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Notes, focus sessions, activity log, and generic reminders
-- ---------------------------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  tags text[] not null default array[]::text[],
  is_pinned boolean not null default false,
  color text not null default '#8b5cf6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_not_empty check (length(btrim(title)) > 0)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_minutes integer not null,
  completed_minutes integer not null default 0,
  session_type text not null default 'focus',
  status text not null default 'completed',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint focus_duration_check check (duration_minutes between 1 and 1440),
  constraint focus_completed_check check (completed_minutes between 0 and duration_minutes),
  constraint focus_status_check check (status in ('completed', 'ended', 'cancelled'))
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  source_table text,
  source_id uuid,
  title text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_type_check check (
    activity_type in (
      'habit_completed',
      'habit_uncompleted',
      'project_created',
      'project_updated',
      'task_completed',
      'note_created',
      'focus_completed',
      'reminder_triggered',
      'custom'
    )
  )
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_table text,
  source_id uuid,
  title text not null,
  body text,
  reminder_time text,
  reminder_days integer[] not null default array[]::integer[],
  remind_at timestamptz,
  sound text not null default 'chime',
  is_enabled boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_title_not_empty check (length(btrim(title)) > 0),
  constraint reminders_source_check check (
    source_table is null
    or source_table in ('habits', 'project_tasks', 'projects', 'notes', 'settings', 'custom')
  ),
  constraint reminders_time_or_at_check check (
    reminder_time is not null
    or remind_at is not null
  ),
  constraint reminders_time_check check (
    reminder_time is null
    or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint reminders_days_check check (
    reminder_days <@ array[0, 1, 2, 3, 4, 5, 6]
  )
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.notes enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.activities enable row level security;
alter table public.reminders enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = user_id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_delete_own on public.profiles for delete using (auth.uid() = user_id);

drop policy if exists settings_select_own on public.settings;
drop policy if exists settings_insert_own on public.settings;
drop policy if exists settings_update_own on public.settings;
drop policy if exists settings_delete_own on public.settings;
create policy settings_select_own on public.settings for select using (auth.uid() = user_id);
create policy settings_insert_own on public.settings for insert with check (auth.uid() = user_id);
create policy settings_update_own on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy settings_delete_own on public.settings for delete using (auth.uid() = user_id);

drop policy if exists habits_select_own on public.habits;
drop policy if exists habits_insert_own on public.habits;
drop policy if exists habits_update_own on public.habits;
drop policy if exists habits_delete_own on public.habits;
create policy habits_select_own on public.habits for select using (auth.uid() = user_id);
create policy habits_insert_own on public.habits for insert with check (auth.uid() = user_id);
create policy habits_update_own on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habits_delete_own on public.habits for delete using (auth.uid() = user_id);

drop policy if exists habit_completions_select_own on public.habit_completions;
drop policy if exists habit_completions_insert_own on public.habit_completions;
drop policy if exists habit_completions_update_own on public.habit_completions;
drop policy if exists habit_completions_delete_own on public.habit_completions;
create policy habit_completions_select_own on public.habit_completions for select using (auth.uid() = user_id);
create policy habit_completions_insert_own on public.habit_completions for insert with check (auth.uid() = user_id);
create policy habit_completions_update_own on public.habit_completions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habit_completions_delete_own on public.habit_completions for delete using (auth.uid() = user_id);

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;
create policy projects_select_own on public.projects for select using (auth.uid() = user_id);
create policy projects_insert_own on public.projects for insert with check (auth.uid() = user_id);
create policy projects_update_own on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy projects_delete_own on public.projects for delete using (auth.uid() = user_id);

drop policy if exists project_tasks_select_own on public.project_tasks;
drop policy if exists project_tasks_insert_own on public.project_tasks;
drop policy if exists project_tasks_update_own on public.project_tasks;
drop policy if exists project_tasks_delete_own on public.project_tasks;
create policy project_tasks_select_own on public.project_tasks for select using (auth.uid() = user_id);
create policy project_tasks_insert_own on public.project_tasks for insert with check (auth.uid() = user_id);
create policy project_tasks_update_own on public.project_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy project_tasks_delete_own on public.project_tasks for delete using (auth.uid() = user_id);

drop policy if exists notes_select_own on public.notes;
drop policy if exists notes_insert_own on public.notes;
drop policy if exists notes_update_own on public.notes;
drop policy if exists notes_delete_own on public.notes;
create policy notes_select_own on public.notes for select using (auth.uid() = user_id);
create policy notes_insert_own on public.notes for insert with check (auth.uid() = user_id);
create policy notes_update_own on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete_own on public.notes for delete using (auth.uid() = user_id);

drop policy if exists focus_sessions_select_own on public.focus_sessions;
drop policy if exists focus_sessions_insert_own on public.focus_sessions;
drop policy if exists focus_sessions_update_own on public.focus_sessions;
drop policy if exists focus_sessions_delete_own on public.focus_sessions;
create policy focus_sessions_select_own on public.focus_sessions for select using (auth.uid() = user_id);
create policy focus_sessions_insert_own on public.focus_sessions for insert with check (auth.uid() = user_id);
create policy focus_sessions_update_own on public.focus_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy focus_sessions_delete_own on public.focus_sessions for delete using (auth.uid() = user_id);

drop policy if exists activities_select_own on public.activities;
drop policy if exists activities_insert_own on public.activities;
drop policy if exists activities_update_own on public.activities;
drop policy if exists activities_delete_own on public.activities;
create policy activities_select_own on public.activities for select using (auth.uid() = user_id);
create policy activities_insert_own on public.activities for insert with check (auth.uid() = user_id);
create policy activities_update_own on public.activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activities_delete_own on public.activities for delete using (auth.uid() = user_id);

drop policy if exists reminders_select_own on public.reminders;
drop policy if exists reminders_insert_own on public.reminders;
drop policy if exists reminders_update_own on public.reminders;
drop policy if exists reminders_delete_own on public.reminders;
create policy reminders_select_own on public.reminders for select using (auth.uid() = user_id);
create policy reminders_insert_own on public.reminders for insert with check (auth.uid() = user_id);
create policy reminders_update_own on public.reminders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy reminders_delete_own on public.reminders for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Maintenance and activity triggers
-- ---------------------------------------------------------------------------

create or replace function public.refresh_habit_completion_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_habit_id uuid := coalesce(new.habit_id, old.habit_id);
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_completed_dates text[];
  v_streak integer;
begin
  select coalesce(array_agg(to_char(completed_on, 'YYYY-MM-DD') order by completed_on), array[]::text[])
  into v_completed_dates
  from public.habit_completions
  where habit_id = v_habit_id
    and user_id = v_user_id;

  v_streak := public.calculate_habit_streak(v_habit_id, current_date);

  update public.habits
  set completed_dates = v_completed_dates,
      streak = v_streak,
      best_streak = greatest(best_streak, v_streak),
      updated_at = now()
  where id = v_habit_id
    and user_id = v_user_id;

  return coalesce(new, old);
end;
$$;

create or replace function public.log_habit_completion_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  select title into v_title
  from public.habits
  where id = new.habit_id
    and user_id = new.user_id;

  insert into public.activities (
    user_id,
    activity_type,
    source_table,
    source_id,
    title,
    detail,
    metadata,
    occurred_at
  )
  values (
    new.user_id,
    'habit_completed',
    'habit_completions',
    new.id,
    'Habit completed',
    coalesce(v_title, 'Habit'),
    jsonb_build_object('habit_id', new.habit_id, 'completed_on', new.completed_on),
    new.completed_at
  );

  return new;
end;
$$;

create or replace function public.log_note_created_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activities (user_id, activity_type, source_table, source_id, title, detail, metadata, occurred_at)
  values (new.user_id, 'note_created', 'notes', new.id, 'Note created', new.title, '{}'::jsonb, new.created_at);
  return new;
end;
$$;

create or replace function public.log_project_created_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activities (user_id, activity_type, source_table, source_id, title, detail, metadata, occurred_at)
  values (new.user_id, 'project_created', 'projects', new.id, 'Project created', new.title, jsonb_build_object('status', new.status), new.created_at);
  return new;
end;
$$;

create or replace function public.log_focus_session_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_minutes > 0 then
    insert into public.activities (user_id, activity_type, source_table, source_id, title, detail, metadata, occurred_at)
    values (
      new.user_id,
      'focus_completed',
      'focus_sessions',
      new.id,
      'Focus session completed',
      new.completed_minutes || ' minutes logged',
      jsonb_build_object('status', new.status, 'duration_minutes', new.duration_minutes),
      coalesce(new.ended_at, new.started_at, new.created_at)
    );
  end if;
  return new;
end;
$$;

create or replace function public.log_task_completed_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_done = true and old.is_done = false then
    insert into public.activities (user_id, activity_type, source_table, source_id, title, detail, metadata, occurred_at)
    values (
      new.user_id,
      'task_completed',
      'project_tasks',
      new.id,
      'Task completed',
      new.title,
      jsonb_build_object('project_id', new.project_id),
      now()
    );
  end if;
  return new;
end;
$$;

create or replace function public.ensure_project_task_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.projects
    where id = new.project_id
      and user_id = new.user_id
  ) then
    raise exception 'project_tasks.project_id must reference one of the same user''s projects'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create or replace function public.log_reminder_triggered_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_triggered_at is not null
    and (old.last_triggered_at is null or old.last_triggered_at is distinct from new.last_triggered_at) then
    insert into public.activities (user_id, activity_type, source_table, source_id, title, detail, metadata, occurred_at)
    values (
      new.user_id,
      'reminder_triggered',
      'reminders',
      new.id,
      'Reminder triggered',
      new.title,
      jsonb_build_object('source_table', new.source_table, 'source_id', new.source_id),
      new.last_triggered_at
    );
  end if;
  return new;
end;
$$;

create or replace function public.refresh_project_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_total integer;
  v_done integer;
  v_status text;
  v_progress integer;
begin
  select count(*), count(*) filter (where is_done)
  into v_total, v_done
  from public.project_tasks
  where project_id = v_project_id
    and user_id = v_user_id;

  select status
  into v_status
  from public.projects
  where id = v_project_id
    and user_id = v_user_id;

  if v_total > 0 then
    v_progress := round((v_done::numeric / v_total::numeric) * 100)::integer;
  elsif v_status = 'completed' then
    v_progress := 100;
  else
    v_progress := 0;
  end if;

  update public.projects
  set progress = v_progress,
      updated_at = now()
  where id = v_project_id
    and user_id = v_user_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at before update on public.habits
for each row execute function public.set_updated_at();

drop trigger if exists habit_completions_set_updated_at on public.habit_completions;
create trigger habit_completions_set_updated_at before update on public.habit_completions
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at before update on public.project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists focus_sessions_set_updated_at on public.focus_sessions;
create trigger focus_sessions_set_updated_at before update on public.focus_sessions
for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at before update on public.reminders
for each row execute function public.set_updated_at();

drop trigger if exists habit_completions_refresh_state_insert on public.habit_completions;
create trigger habit_completions_refresh_state_insert after insert on public.habit_completions
for each row execute function public.refresh_habit_completion_state();

drop trigger if exists habit_completions_refresh_state_delete on public.habit_completions;
create trigger habit_completions_refresh_state_delete after delete on public.habit_completions
for each row execute function public.refresh_habit_completion_state();

drop trigger if exists habit_completions_log_activity on public.habit_completions;
create trigger habit_completions_log_activity after insert on public.habit_completions
for each row execute function public.log_habit_completion_activity();

drop trigger if exists notes_log_created_activity on public.notes;
create trigger notes_log_created_activity after insert on public.notes
for each row execute function public.log_note_created_activity();

drop trigger if exists projects_log_created_activity on public.projects;
create trigger projects_log_created_activity after insert on public.projects
for each row execute function public.log_project_created_activity();

drop trigger if exists focus_sessions_log_activity on public.focus_sessions;
create trigger focus_sessions_log_activity after insert on public.focus_sessions
for each row execute function public.log_focus_session_activity();

drop trigger if exists project_tasks_log_completed_activity on public.project_tasks;
create trigger project_tasks_log_completed_activity after update on public.project_tasks
for each row execute function public.log_task_completed_activity();

drop trigger if exists project_tasks_ensure_owner on public.project_tasks;
create trigger project_tasks_ensure_owner before insert or update of project_id, user_id on public.project_tasks
for each row execute function public.ensure_project_task_owner();

drop trigger if exists project_tasks_refresh_progress_insert on public.project_tasks;
create trigger project_tasks_refresh_progress_insert after insert on public.project_tasks
for each row execute function public.refresh_project_progress();

drop trigger if exists project_tasks_refresh_progress_update on public.project_tasks;
create trigger project_tasks_refresh_progress_update after update of is_done on public.project_tasks
for each row execute function public.refresh_project_progress();

drop trigger if exists project_tasks_refresh_progress_delete on public.project_tasks;
create trigger project_tasks_refresh_progress_delete after delete on public.project_tasks
for each row execute function public.refresh_project_progress();

drop trigger if exists reminders_log_triggered_activity on public.reminders;
create trigger reminders_log_triggered_activity after update of last_triggered_at on public.reminders
for each row execute function public.log_reminder_triggered_activity();

-- ---------------------------------------------------------------------------
-- Automatic profile/settings creation after Supabase Auth signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (user_id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles/settings for any users already present in auth.users.
insert into public.profiles (user_id, full_name, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  email
from auth.users
on conflict (user_id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

insert into public.settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists settings_user_id_idx on public.settings(user_id);

create index if not exists habits_user_id_created_at_idx on public.habits(user_id, created_at desc);
create index if not exists habits_user_id_active_idx on public.habits(user_id, is_active);
create index if not exists habits_reminders_idx on public.habits(user_id, reminder_enabled, reminder_time)
where reminder_enabled = true;
create index if not exists habits_completed_dates_gin_idx on public.habits using gin(completed_dates);

create index if not exists habit_completions_user_date_idx on public.habit_completions(user_id, completed_on desc);
create index if not exists habit_completions_habit_date_idx on public.habit_completions(habit_id, completed_on desc);

create index if not exists projects_user_id_created_at_idx on public.projects(user_id, created_at desc);
create index if not exists projects_user_id_status_idx on public.projects(user_id, status);
create index if not exists projects_deadline_idx on public.projects(user_id, deadline)
where deadline is not null;

create index if not exists project_tasks_user_id_idx on public.project_tasks(user_id);
create index if not exists project_tasks_project_position_idx on public.project_tasks(project_id, position, created_at);
create index if not exists project_tasks_due_date_idx on public.project_tasks(user_id, due_date)
where due_date is not null;
create index if not exists project_tasks_reminders_idx on public.project_tasks(user_id, reminder_enabled, reminder_time)
where reminder_enabled = true and is_done = false;

create index if not exists notes_user_id_created_at_idx on public.notes(user_id, created_at desc);
create index if not exists notes_user_id_pinned_idx on public.notes(user_id, is_pinned desc, created_at desc);
create index if not exists notes_tags_gin_idx on public.notes using gin(tags);

create index if not exists focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at desc);
create index if not exists focus_sessions_user_status_idx on public.focus_sessions(user_id, status);

create index if not exists activities_user_occurred_idx on public.activities(user_id, occurred_at desc);
create index if not exists activities_user_type_idx on public.activities(user_id, activity_type);
create index if not exists activities_metadata_gin_idx on public.activities using gin(metadata);

create index if not exists reminders_user_enabled_idx on public.reminders(user_id, is_enabled);
create index if not exists reminders_user_time_idx on public.reminders(user_id, reminder_time)
where is_enabled = true;
create index if not exists reminders_user_remind_at_idx on public.reminders(user_id, remind_at)
where is_enabled = true and remind_at is not null;

-- Supabase API privileges for authenticated users. RLS still restricts rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.settings,
  public.habits,
  public.habit_completions,
  public.projects,
  public.project_tasks,
  public.notes,
  public.focus_sessions,
  public.activities,
  public.reminders
to authenticated;

grant execute on function public.calculate_habit_streak(uuid, date) to authenticated;

commit;
