-- Phase 3: Tasks — one-off items, distinct from Habits. Complete or carry to
-- tomorrow; carry_over_count drives the "still worth keeping?" nudge instead
-- of a separate history table.

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

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);
