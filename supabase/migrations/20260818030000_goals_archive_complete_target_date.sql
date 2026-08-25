-- Brain-Max pivot: goals get target_date, and split status into
-- active/completed/archived (was active/retired). No more specificity gate
-- at the database level — was_vague/original_statement stay as historical
-- columns but nothing new writes to them.

alter table public.goals rename column retired_at to archived_at;

update public.goals set status = 'archived' where status = 'retired';

alter table public.goals drop constraint if exists goals_status_check;
alter table public.goals
  add constraint goals_status_check
  check (status in ('active', 'completed', 'archived'));

alter table public.goals add column if not exists target_date date;
alter table public.goals add column if not exists completed_at timestamptz;
