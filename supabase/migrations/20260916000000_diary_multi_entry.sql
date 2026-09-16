-- Diary becomes a real multi-entry archive instead of one row per day:
-- drop the (user_id, date) uniqueness (looked up dynamically since its
-- auto-generated name isn't guaranteed), rename evening_entry -> content,
-- add title + updated_at, add the missing delete policy.

do $$
declare
  cname text;
begin
  select tc.constraint_name into cname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'diary_entries'
    and tc.constraint_type = 'UNIQUE'
  group by tc.constraint_name
  having array_agg(kcu.column_name order by kcu.column_name) = array['date', 'user_id'];

  if cname is not null then
    execute format('alter table public.diary_entries drop constraint %I', cname);
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'diary_entries' and column_name = 'evening_entry'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'diary_entries' and column_name = 'content'
  ) then
    alter table public.diary_entries rename column evening_entry to content;
  end if;
end $$;

alter table public.diary_entries add column if not exists title text;
alter table public.diary_entries add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Users can delete their own diary entries" on public.diary_entries;
create policy "Users can delete their own diary entries"
  on public.diary_entries for delete
  using (auth.uid() = user_id);
