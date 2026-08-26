create table if not exists public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.affirmations enable row level security;

create policy "Users can view their own affirmations"
  on public.affirmations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own affirmations"
  on public.affirmations for insert
  with check (auth.uid() = user_id);
