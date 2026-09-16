create table if not exists public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0),
  meditation_type text not null default 'silent'
    check (meditation_type in ('silent', 'breath', 'body_scan', 'open_awareness')),
  created_at timestamptz not null default now()
);

alter table public.meditation_sessions enable row level security;

drop policy if exists "Users can view their own meditation sessions" on public.meditation_sessions;
create policy "Users can view their own meditation sessions"
  on public.meditation_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meditation sessions" on public.meditation_sessions;
create policy "Users can insert their own meditation sessions"
  on public.meditation_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own meditation sessions" on public.meditation_sessions;
create policy "Users can delete their own meditation sessions"
  on public.meditation_sessions for delete
  using (auth.uid() = user_id);
