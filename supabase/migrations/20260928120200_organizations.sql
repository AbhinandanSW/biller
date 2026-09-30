-- Organizations, membership, roles and invitations.
--
-- Tenant isolation model: a user can see an organization's data only while
-- they are a member of it. Every tenant-owned table carries organization_id
-- and its policies go through private.is_member / private.has_permission.
--
-- Membership changes never happen through direct table writes. They go
-- through the security-definer functions at the bottom of this file, which
-- enforce the ownership rules (e.g. an organization always keeps an owner).
--
-- Errors raised here use SQLSTATEs that the app maps to API error codes
-- (src/lib/api/db-errors.ts):
--   28000 → UNAUTHORIZED   42501 → FORBIDDEN   P0002 → NOT_FOUND
--   23505 → CONFLICT       22023 / 23514 → VALIDATION_ERROR

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  -- Business profile
  name text not null check (char_length(trim(name)) between 1 and 200),
  legal_name text check (char_length(legal_name) <= 200),
  gstin text check (
    gstin = upper(gstin) and gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'
  ),
  pan text check (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  email text check (char_length(email) <= 320 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 20),
  website text check (char_length(website) <= 300),
  logo_path text check (char_length(logo_path) <= 500),

  -- Address
  address_line_1 text check (char_length(address_line_1) <= 200),
  address_line_2 text check (char_length(address_line_2) <= 200),
  city text check (char_length(city) <= 100),
  -- Two-digit GST state code; drives CGST/SGST vs IGST.
  state_code text check (state_code ~ '^[0-9]{2}$'),
  pincode text,
  country text not null default 'IN' check (country ~ '^[A-Z]{2}$'),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 64),

  -- GST
  gst_enabled boolean not null default true,
  prices_include_tax boolean not null default false,
  default_tax_rate numeric(5, 2) not null default 18 check (default_tax_rate between 0 and 100),

  -- Rounding (mirrors RoundingSettings in src/lib/calculations)
  rounding_mode text not null default 'HALF_UP' check (rounding_mode in ('HALF_UP', 'HALF_EVEN')),
  tax_rounding text not null default 'PER_LINE' check (tax_rounding in ('PER_LINE', 'PER_INVOICE')),
  round_grand_total boolean not null default true,

  -- Document numbering
  order_prefix text not null default 'ORD' check (order_prefix ~ '^[A-Z0-9-]{1,10}$'),
  invoice_prefix text not null default 'INV' check (invoice_prefix ~ '^[A-Z0-9-]{1,10}$'),

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organizations_pincode_check
    check (pincode is null or country <> 'IN' or pincode ~ '^[1-9][0-9]{5}$'),
  -- The first two digits of a GSTIN are the registered state.
  constraint organizations_gstin_state_check
    check (gstin is null or state_code is null or left(gstin, 2) = state_code)
);

create trigger set_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

create trigger set_updated_at before update on public.organization_members
  for each row execute function private.set_updated_at();

-- Which permissions each role grants. Global for now; per-organization
-- custom roles can be layered on later without changing the policies.
create table public.role_permissions (
  role public.app_role not null,
  permission text not null,
  primary key (role, permission)
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.app_role not null check (role <> 'owner'),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REVOKED')),
  invited_by uuid references auth.users (id) on delete set null,
  accepted_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organization_invitations_pending_idx
  on public.organization_invitations (organization_id, email) where status = 'PENDING';
create index organization_invitations_email_idx on public.organization_invitations (email);

create trigger set_updated_at before update on public.organization_invitations
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role permissions (keep in sync with src/lib/auth/permissions.ts — a test
-- compares the two)
-- ---------------------------------------------------------------------------

insert into public.role_permissions (role, permission)
select 'owner'::public.app_role, p from unnest(array[
  'organization.view', 'organization.update', 'members.view', 'members.manage', 'audit.view',
  'products.view', 'products.create', 'products.update', 'products.delete',
  'customers.view', 'customers.create', 'customers.update', 'customers.delete',
  'pricing.view', 'pricing.manage',
  'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.delete',
  'invoices.view', 'invoices.create', 'invoices.send', 'invoices.cancel',
  'reports.view'
]) as p
union all
-- Admins have every permission; what they can't do is change ownership,
-- which the membership functions enforce separately.
select 'admin', p from unnest(array[
  'organization.view', 'organization.update', 'members.view', 'members.manage', 'audit.view',
  'products.view', 'products.create', 'products.update', 'products.delete',
  'customers.view', 'customers.create', 'customers.update', 'customers.delete',
  'pricing.view', 'pricing.manage',
  'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.delete',
  'invoices.view', 'invoices.create', 'invoices.send', 'invoices.cancel',
  'reports.view'
]) as p
union all
select 'manager', p from unnest(array[
  'organization.view', 'members.view',
  'products.view', 'products.create', 'products.update', 'products.delete',
  'customers.view', 'customers.create', 'customers.update', 'customers.delete',
  'pricing.view', 'pricing.manage',
  'orders.view', 'orders.create', 'orders.update', 'orders.cancel',
  'invoices.view', 'invoices.create', 'invoices.send',
  'reports.view'
]) as p
union all
select 'sales', p from unnest(array[
  'organization.view', 'products.view', 'customers.view', 'pricing.view',
  'orders.view', 'orders.create', 'orders.update',
  'invoices.view'
]) as p
union all
select 'viewer', p from unnest(array[
  'organization.view', 'members.view', 'products.view', 'customers.view', 'pricing.view',
  'orders.view', 'invoices.view', 'reports.view'
]) as p;

-- ---------------------------------------------------------------------------
-- RLS helpers. SECURITY DEFINER so policies on organization_members don't
-- recurse into themselves.
-- ---------------------------------------------------------------------------

create function private.is_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = (select auth.uid())
  );
$$;

create function private.member_role(p_organization_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.organization_members m
  where m.organization_id = p_organization_id and m.user_id = (select auth.uid());
$$;

create function private.has_permission(p_organization_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.role_permissions rp on rp.role = m.role
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and rp.permission = p_permission
  );
$$;

-- True when the current user and p_user_id belong to at least one common organization.
create function private.shares_organization(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

-- Locks the organization's owner rows, then fails if p_user_id is the only owner.
create function private.assert_other_owner_exists(p_organization_id uuid, p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.organization_members
  where organization_id = p_organization_id and role = 'owner'
  order by id
  for update;

  if not exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and role = 'owner' and user_id <> p_user_id
  ) then
    raise exception 'An organization must always have at least one owner' using errcode = '22023';
  end if;
end;
$$;

revoke all on function private.is_member(uuid) from public;
revoke all on function private.member_role(uuid) from public;
revoke all on function private.has_permission(uuid, text) from public;
revoke all on function private.shares_organization(uuid) from public;
revoke all on function private.assert_other_owner_exists(uuid, uuid) from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.member_role(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text) to authenticated;
grant execute on function private.shares_organization(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_invitations enable row level security;

revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;
revoke all on public.role_permissions from anon, authenticated;
revoke all on public.organization_invitations from anon, authenticated;

grant select on public.organizations to authenticated;
-- Only settings columns are writable; id, created_by and timestamps are not.
grant update (
  name, legal_name, gstin, pan, email, phone, website, logo_path,
  address_line_1, address_line_2, city, state_code, pincode, country, currency, timezone,
  gst_enabled, prices_include_tax, default_tax_rate,
  rounding_mode, tax_rounding, round_grand_total,
  order_prefix, invoice_prefix
) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.organization_invitations to authenticated;

create policy "Members can view their organizations" on public.organizations
  for select to authenticated
  using (private.is_member(id));

create policy "Permitted members can update their organization" on public.organizations
  for update to authenticated
  using (private.has_permission(id, 'organization.update'))
  with check (private.has_permission(id, 'organization.update'));

create policy "Members can view fellow members" on public.organization_members
  for select to authenticated
  using (private.is_member(organization_id));

create policy "Role permissions are public to signed-in users" on public.role_permissions
  for select to authenticated
  using (true);

create policy "Member managers and invitees can view invitations" on public.organization_invitations
  for select to authenticated
  using (
    private.has_permission(organization_id, 'members.manage')
    or email = lower((select auth.jwt()) ->> 'email')
  );

create policy "Users can view their own and fellow members' profiles" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_organization(id));

-- ---------------------------------------------------------------------------
-- Membership functions (the only way to change membership)
-- ---------------------------------------------------------------------------

-- Creates an organization with the caller as its owner.
create function public.create_organization(
  p_name text,
  p_legal_name text default null,
  p_gstin text default null,
  p_state_code text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_gstin text := nullif(upper(trim(p_gstin)), '');
  v_organization public.organizations;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  insert into public.organizations (name, legal_name, gstin, state_code, created_by)
  values (
    trim(p_name),
    nullif(trim(p_legal_name), ''),
    v_gstin,
    coalesce(nullif(trim(p_state_code), ''), left(v_gstin, 2)),
    v_user_id
  )
  returning * into v_organization;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization.id, v_user_id, 'owner');

  return v_organization;
end;
$$;

-- Invites someone by email. Replaces any pending invitation for that email.
create function public.invite_member(
  p_organization_id uuid,
  p_email text,
  p_role public.app_role
)
returns public.organization_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_invitation public.organization_invitations;
begin
  if not private.has_permission(p_organization_id, 'members.manage') then
    raise exception 'You do not have permission to manage members' using errcode = '42501';
  end if;
  if p_role = 'owner' then
    raise exception 'Ownership cannot be granted by invitation' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.organization_members m
    join auth.users u on u.id = m.user_id
    where m.organization_id = p_organization_id and lower(u.email) = v_email
  ) then
    raise exception 'This person is already a member' using errcode = '23505';
  end if;

  update public.organization_invitations
  set status = 'REVOKED'
  where organization_id = p_organization_id and email = v_email and status = 'PENDING';

  insert into public.organization_invitations (organization_id, email, role, invited_by)
  values (p_organization_id, v_email, p_role, auth.uid())
  returning * into v_invitation;

  return v_invitation;
end;
$$;

create function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.organization_invitations;
begin
  select * into v_invitation from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found or not private.has_permission(v_invitation.organization_id, 'members.manage') then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if v_invitation.status <> 'PENDING' then
    raise exception 'This invitation is no longer pending' using errcode = '22023';
  end if;

  update public.organization_invitations set status = 'REVOKED' where id = p_invitation_id;
end;
$$;

-- Accepts an invitation addressed to the caller's confirmed email.
create function public.accept_invitation(p_invitation_id uuid)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invitation public.organization_invitations;
  v_member public.organization_members;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select lower(u.email) into v_email from auth.users u
  where u.id = v_user_id and u.email_confirmed_at is not null;

  select * into v_invitation from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found or v_invitation.email is distinct from v_email then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if v_invitation.status <> 'PENDING' or v_invitation.expires_at <= now() then
    raise exception 'This invitation is no longer valid' using errcode = '22023';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_invitation.organization_id, v_user_id, v_invitation.role, v_invitation.invited_by)
  on conflict (organization_id, user_id) do nothing
  returning * into v_member;

  if v_member.id is null then
    raise exception 'You are already a member of this organization' using errcode = '23505';
  end if;

  update public.organization_invitations
  set status = 'ACCEPTED', accepted_at = now(), accepted_by = v_user_id
  where id = p_invitation_id;

  return v_member;
end;
$$;

-- Changes a member's role. Only owners can grant or take away ownership, and
-- the last owner cannot be demoted.
create function public.update_member_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.app_role
)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
begin
  if not private.has_permission(p_organization_id, 'members.manage') then
    raise exception 'You do not have permission to manage members' using errcode = '42501';
  end if;

  select * into v_member from public.organization_members
  where organization_id = p_organization_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if (v_member.role = 'owner' or p_role = 'owner')
    and private.member_role(p_organization_id) <> 'owner' then
    raise exception 'Only an owner can change ownership' using errcode = '42501';
  end if;
  if v_member.role = 'owner' and p_role <> 'owner' then
    perform private.assert_other_owner_exists(p_organization_id, p_user_id);
  end if;

  update public.organization_members set role = p_role
  where id = v_member.id
  returning * into v_member;

  return v_member;
end;
$$;

-- Removes a member, or lets the caller leave. Only owners can remove owners,
-- and the last owner cannot leave.
create function public.remove_member(p_organization_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_member public.organization_members;
begin
  if v_actor_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_user_id <> v_actor_id and not private.has_permission(p_organization_id, 'members.manage') then
    raise exception 'You do not have permission to manage members' using errcode = '42501';
  end if;

  select * into v_member from public.organization_members
  where organization_id = p_organization_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if v_member.role = 'owner' then
    if p_user_id <> v_actor_id and private.member_role(p_organization_id) <> 'owner' then
      raise exception 'Only an owner can remove an owner' using errcode = '42501';
    end if;
    perform private.assert_other_owner_exists(p_organization_id, p_user_id);
  end if;

  delete from public.organization_members where id = v_member.id;
end;
$$;

-- The caller's permissions in an organization (empty when not a member).
create function public.my_permissions(p_organization_id uuid)
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select rp.permission
  from public.organization_members m
  join public.role_permissions rp on rp.role = m.role
  where m.organization_id = p_organization_id and m.user_id = (select auth.uid())
  order by rp.permission;
$$;

-- Supabase grants EXECUTE on public functions to anon by default.
revoke all on function public.create_organization(text, text, text, text) from public, anon;
revoke all on function public.invite_member(uuid, text, public.app_role) from public, anon;
revoke all on function public.revoke_invitation(uuid) from public, anon;
revoke all on function public.accept_invitation(uuid) from public, anon;
revoke all on function public.update_member_role(uuid, uuid, public.app_role) from public, anon;
revoke all on function public.remove_member(uuid, uuid) from public, anon;
revoke all on function public.my_permissions(uuid) from public, anon;
grant execute on function public.create_organization(text, text, text, text) to authenticated;
grant execute on function public.invite_member(uuid, text, public.app_role) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.update_member_role(uuid, uuid, public.app_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.my_permissions(uuid) to authenticated;
