-- Phase 4: Mindset — reframe only for v1. Generic `type` column so
-- self-talk/visualization can reuse this table later without a new one.

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

create policy "Users can view their own mindset sessions"
  on public.mindset_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mindset sessions"
  on public.mindset_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mindset sessions"
  on public.mindset_sessions for update
  using (auth.uid() = user_id);
