-- Phase 4: the daily loop — morning intention, evening diary, quotes.
-- One diary_entries row per user per day; morning and evening are saved
-- independently but live on the same row.

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  morning_intention text,
  morning_goal_id uuid references public.goals(id) on delete set null,
  evening_entry text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.diary_entries enable row level security;

create policy "Users can view their own diary entries"
  on public.diary_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own diary entries"
  on public.diary_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own diary entries"
  on public.diary_entries for update
  using (auth.uid() = user_id);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  source text,
  added_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "Users can view their own quotes"
  on public.quotes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quotes"
  on public.quotes for insert
  with check (auth.uid() = user_id);
