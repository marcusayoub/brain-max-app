create table if not exists public.whoop_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  whoop_user_id text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scope text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS is enabled with deliberately NO policies for the anon/authenticated
-- roles: WHOOP access/refresh tokens must never be selectable through
-- PostgREST from the browser, even by the user who owns the row. This
-- table is only ever read or written server-side via the service-role
-- client (lib/supabase/admin.ts). The browser only ever learns whether a
-- user is connected through GET /api/whoop/status, which never returns
-- the token columns.
alter table public.whoop_connections enable row level security;
