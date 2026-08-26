alter table public.quotes add column if not exists tags text[] not null default '{}';

create index if not exists quotes_tags_idx on public.quotes using gin (tags);
