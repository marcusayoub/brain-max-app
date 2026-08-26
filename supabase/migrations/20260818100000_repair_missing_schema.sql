-- Repair pass: several earlier migrations in this repo were written but
-- never actually applied to the live database (confirmed via direct schema
-- introspection — habits/tasks/mindset_sessions didn't exist at all, and
-- goals/quotes were missing columns the app has been relying on since the
-- Brain-Max pivot). This migration is the single source of truth for
-- reaching the schema the current code expects, written to be safe to run
-- regardless of which earlier pieces did or didn't land.

-- habits + habit_checkins (were never created)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

drop policy if exists "Users can view their own habits" on public.habits;
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own habits" on public.habits;
create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create table if not exists public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  checked_at timestamptz not null default now(),
  unique (habit_id, date)
);

alter table public.habit_checkins enable row level security;

drop policy if exists "Users can view their own checkins" on public.habit_checkins;
create policy "Users can view their own checkins"
  on public.habit_checkins for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own checkins" on public.habit_checkins;
create policy "Users can insert their own checkins"
  on public.habit_checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own checkins" on public.habit_checkins;
create policy "Users can delete their own checkins"
  on public.habit_checkins for delete
  using (auth.uid() = user_id);

-- tasks (was never created)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'done', 'let_go')),
  scheduled_date date not null default current_date,
  carry_over_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

-- mindset_sessions (was never created)
create table if not exists public.mindset_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'reframe' check (type in ('reframe')),
  situation text not null,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  reflection text,
  created_at timestamptz not null default now()
);

alter table public.mindset_sessions enable row level security;

drop policy if exists "Users can view their own mindset sessions" on public.mindset_sessions;
create policy "Users can view their own mindset sessions"
  on public.mindset_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own mindset sessions" on public.mindset_sessions;
create policy "Users can insert their own mindset sessions"
  on public.mindset_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own mindset sessions" on public.mindset_sessions;
create policy "Users can update their own mindset sessions"
  on public.mindset_sessions for update
  using (auth.uid() = user_id);

-- goals: rename retired_at -> archived_at, allow completed/archived status,
-- add target_date/completed_at (all confirmed missing on the live table)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'retired_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'archived_at'
  ) then
    alter table public.goals rename column retired_at to archived_at;
  end if;
end $$;

alter table public.goals add column if not exists archived_at timestamptz;

-- Constraint must be dropped, data fixed, THEN re-added — adding a check
-- constraint validates all existing rows immediately, so it must come last.
alter table public.goals drop constraint if exists goals_status_check;

update public.goals set status = 'archived' where status = 'retired';

alter table public.goals
  add constraint goals_status_check
  check (status in ('active', 'completed', 'archived'));

alter table public.goals add column if not exists target_date date;
alter table public.goals add column if not exists completed_at timestamptz;

-- quotes: rename source -> author, add note (confirmed missing)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'source'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'author'
  ) then
    alter table public.quotes rename column source to author;
  end if;
end $$;

alter table public.quotes add column if not exists author text;
alter table public.quotes add column if not exists note text;
