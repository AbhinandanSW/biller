-- Audit log: an append-only record of changes to important business records.
-- Rows are written by triggers only; nobody (other than the service role)
-- can insert, change or delete them.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null
    check (action in ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'SEND', 'GENERATE')),
  -- For updates, only the columns that changed.
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_created_idx
  on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx
  on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy "Permitted members can view the audit log" on public.audit_logs
  for select to authenticated
  using (private.has_permission(organization_id, 'audit.view'));

-- Generic row audit trigger. TG_ARGV[0] names the column holding the
-- organization id (defaults to organization_id). An update that changes
-- `status` is logged as STATUS_CHANGE; updates that only touch updated_at
-- are skipped.
create function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_column text := coalesce(tg_argv[0], 'organization_id');
  v_old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new_row, v_old_row);
  v_old jsonb := v_old_row;
  v_new jsonb := v_new_row;
  v_action text := case tg_op when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(o.key, o.value), '{}'::jsonb) into v_old
    from jsonb_each(v_old_row) o
    where o.key <> 'updated_at' and o.value is distinct from v_new_row -> o.key;

    select coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb) into v_new
    from jsonb_each(v_new_row) n
    where n.key <> 'updated_at' and n.value is distinct from v_old_row -> n.key;

    if v_new = '{}'::jsonb then
      return null;
    end if;
    if v_new ? 'status' then
      v_action := 'STATUS_CHANGE';
    end if;
  end if;

  insert into public.audit_logs (organization_id, user_id, entity_type, entity_id, action, old_data, new_data)
  values (
    (v_row ->> v_org_column)::uuid,
    auth.uid(),
    tg_table_name,
    (v_row ->> 'id')::uuid,
    v_action,
    v_old,
    v_new
  );
  return null;
end;
$$;
revoke all on function private.audit_row() from public;

create trigger audit after insert or update on public.organizations
  for each row execute function private.audit_row('id');
create trigger audit after insert or update or delete on public.organization_members
  for each row execute function private.audit_row();
create trigger audit after insert or update on public.organization_invitations
  for each row execute function private.audit_row();
