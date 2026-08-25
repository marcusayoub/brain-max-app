-- Phase 3: habits (optionally attached to a goal) and daily check-offs.

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

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

create policy "Users can view their own checkins"
  on public.habit_checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checkins"
  on public.habit_checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own checkins"
  on public.habit_checkins for delete
  using (auth.uid() = user_id);
