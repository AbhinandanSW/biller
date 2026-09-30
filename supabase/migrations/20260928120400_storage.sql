-- Private bucket for all organization files. Paths are
--   organizations/{organization_id}/{area}/...
-- Members can read their organization's files. Writes depend on the area:
--   branding/   → organization.update (logo)
--   products/   → products.update (product images)
--   customers/  → customers.update (customer documents)
-- Anything else (invoices/, orders/) is written server-side with the service
-- role only, so generated documents can't be tampered with.

insert into storage.buckets (id, name, public)
values ('organization-files', 'organization-files', false)
on conflict (id) do nothing;

create function private.organization_id_from_path(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
      then split_part(p_name, '/', 2)::uuid
  end;
$$;

create function private.storage_write_permission(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case split_part(p_name, '/', 3)
    when 'branding' then 'organization.update'
    when 'products' then 'products.update'
    when 'customers' then 'customers.update'
  end;
$$;

revoke all on function private.organization_id_from_path(text) from public;
revoke all on function private.storage_write_permission(text) from public;
grant execute on function private.organization_id_from_path(text) to authenticated;
grant execute on function private.storage_write_permission(text) to authenticated;

create policy "Members can read their organization's files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'organization-files'
    and private.is_member(private.organization_id_from_path(name))
  );

create policy "Permitted members can upload organization files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'organization-files'
    and private.has_permission(
      private.organization_id_from_path(name), private.storage_write_permission(name)
    )
  );

create policy "Permitted members can update organization files" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'organization-files'
    and private.has_permission(
      private.organization_id_from_path(name), private.storage_write_permission(name)
    )
  )
  with check (
    bucket_id = 'organization-files'
    and private.has_permission(
      private.organization_id_from_path(name), private.storage_write_permission(name)
    )
  );

create policy "Permitted members can delete organization files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'organization-files'
    and private.has_permission(
      private.organization_id_from_path(name), private.storage_write_permission(name)
    )
  );
