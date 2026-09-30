-- Identity: one profile per auth user, created automatically on signup.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 200),
  phone text check (char_length(phone) <= 20),
  avatar_path text check (char_length(avatar_path) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
revoke all on function private.handle_user_email_change() from public;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

alter table public.profiles enable row level security;

-- Supabase grants everything to anon/authenticated by default; RLS is the
-- real guard, but we also keep table privileges to the minimum needed.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_path) on public.profiles to authenticated;

create policy "Users can update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- The select policy needs organization_members, so it is created in the
-- organizations migration.
