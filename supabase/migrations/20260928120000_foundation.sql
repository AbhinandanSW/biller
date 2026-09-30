-- Foundation: private helper schema, shared enums and trigger functions.

-- Helpers used by RLS policies and triggers live in `private`, which is not
-- exposed through the Data API (only `public` is, see config.toml).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create type public.app_role as enum ('owner', 'admin', 'manager', 'sales', 'viewer');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public;
