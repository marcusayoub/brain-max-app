alter table public.quotes rename column source to author;
alter table public.quotes add column if not exists note text;
