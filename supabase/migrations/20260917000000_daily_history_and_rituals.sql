-- Daily tab: permanent history, evening close, and the miss signal.
-- habit_logs replaces habit_checkins as the source of truth for both
-- "is this checked today" and permanent history. habit_checkins is left
-- in place, unused, rather than dropped.

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete set null,
  habit_title text not null,
  date date not null,
  completed boolean not null,
  completed_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

alter table public.habit_logs enable row level security;

drop policy if exists "Users can view their own habit logs" on public.habit_logs;
create policy "Users can view their own habit logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own habit logs" on public.habit_logs;
create policy "Users can insert their own habit logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own habit logs" on public.habit_logs;
create policy "Users can update their own habit logs"
  on public.habit_logs for update
  using (auth.uid() = user_id);

-- Copy existing habit_checkins rows forward as completed:true logs.
-- Every habit_checkins row represents a day that was checked, so this
-- maps directly with no ambiguity. Guarded so re-running this migration
-- doesn't duplicate rows.
insert into public.habit_logs (user_id, habit_id, habit_title, date, completed, completed_at)
select hc.user_id, hc.habit_id, h.title, hc.date, true, hc.checked_at
from public.habit_checkins hc
join public.habits h on h.id = hc.habit_id
on conflict (user_id, habit_id, date) do nothing;

create table if not exists public.day_closes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  closed_at timestamptz,
  skipped_at timestamptz,
  unique (user_id, date)
);

alter table public.day_closes enable row level security;

drop policy if exists "Users can view their own day closes" on public.day_closes;
create policy "Users can view their own day closes"
  on public.day_closes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own day closes" on public.day_closes;
create policy "Users can insert their own day closes"
  on public.day_closes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own day closes" on public.day_closes;
create policy "Users can update their own day closes"
  on public.day_closes for update
  using (auth.uid() = user_id);

create table if not exists public.habit_signal_dismissals (
  habit_id uuid primary key references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_until date not null
);

alter table public.habit_signal_dismissals enable row level security;

drop policy if exists "Users can view their own signal dismissals" on public.habit_signal_dismissals;
create policy "Users can view their own signal dismissals"
  on public.habit_signal_dismissals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own signal dismissals" on public.habit_signal_dismissals;
create policy "Users can insert their own signal dismissals"
  on public.habit_signal_dismissals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own signal dismissals" on public.habit_signal_dismissals;
create policy "Users can update their own signal dismissals"
  on public.habit_signal_dismissals for update
  using (auth.uid() = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  evening_close_hour integer not null default 21,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own settings" on public.user_settings;
create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- The original diary_entries schema had `date date not null` with no
-- default. The multi-entry rebuild (20260916000000) stopped setting it on
-- insert (entries are now created_at/updated_at-keyed, not date-keyed),
-- but never relaxed this constraint — so every new diary entry insert,
-- including the evening close's below, would fail. Nothing in the app
-- reads this column anymore; it's relaxed rather than dropped.
alter table public.diary_entries alter column date drop not null;

alter table public.diary_entries add column if not exists entry_type text not null default 'reflection';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'diary_entries_entry_type_check'
  ) then
    alter table public.diary_entries
      add constraint diary_entries_entry_type_check
      check (entry_type in ('reflection', 'day_close'));
  end if;
end $$;
