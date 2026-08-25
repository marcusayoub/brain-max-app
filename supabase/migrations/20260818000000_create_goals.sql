-- Phase 2: goals table, with row-level security from the start.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  statement text not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  was_vague boolean not null default false,
  original_statement text,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

alter table public.goals enable row level security;

create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id);
