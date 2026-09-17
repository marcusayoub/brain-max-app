-- Tasks get grouped into user-defined life areas, which plug into the
-- existing goal hierarchy (tasks.goal_id already existed) rather than
-- becoming a second, parallel taxonomy.

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#8b8f8d',
  neglect_threshold_days integer not null default 7,
  is_default boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.areas enable row level security;

drop policy if exists "Users can view their own areas" on public.areas;
create policy "Users can view their own areas"
  on public.areas for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own areas" on public.areas;
create policy "Users can insert their own areas"
  on public.areas for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own areas" on public.areas;
create policy "Users can update their own areas"
  on public.areas for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own areas" on public.areas;
create policy "Users can delete their own areas"
  on public.areas for delete
  using (auth.uid() = user_id);

-- Exactly one default area per user — the permanent fallback bucket a
-- task lands in if the user doesn't pick one. Enforced at the DB level,
-- not just app convention.
create unique index if not exists areas_one_default_per_user
  on public.areas (user_id) where (is_default);

alter table public.tasks add column if not exists area_id uuid references public.areas(id) on delete restrict;
alter table public.goals add column if not exists area_id uuid references public.areas(id) on delete set null;

-- Seed the 5-area starter set for every user who already has tasks, then
-- backfill their existing tasks (area_id is null pre-migration) onto the
-- default area. A user with zero tasks at migration time gets the same
-- starter set lazily, the first time they open the Tasks tab.
do $$
declare
  uid uuid;
  default_area_id uuid;
begin
  for uid in select distinct user_id from public.tasks loop
    if not exists (select 1 from public.areas where user_id = uid) then
      insert into public.areas (user_id, name, color, position, is_default)
      values
        (uid, 'Business', '#7b93a8', 0, false),
        (uid, 'Family', '#b98a8a', 1, false),
        (uid, 'Health', '#8aab8f', 2, false),
        (uid, 'Learning', '#c2a06b', 3, false),
        (uid, 'Personal', '#a08cc0', 4, true);
    end if;

    select id into default_area_id from public.areas where user_id = uid and is_default limit 1;

    update public.tasks set area_id = default_area_id where user_id = uid and area_id is null;
  end loop;
end $$;

alter table public.tasks alter column area_id set not null;

create table if not exists public.area_signal_dismissals (
  area_id uuid primary key references public.areas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_until date not null
);

alter table public.area_signal_dismissals enable row level security;

drop policy if exists "Users can view their own area dismissals" on public.area_signal_dismissals;
create policy "Users can view their own area dismissals"
  on public.area_signal_dismissals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own area dismissals" on public.area_signal_dismissals;
create policy "Users can insert their own area dismissals"
  on public.area_signal_dismissals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own area dismissals" on public.area_signal_dismissals;
create policy "Users can update their own area dismissals"
  on public.area_signal_dismissals for update
  using (auth.uid() = user_id);
