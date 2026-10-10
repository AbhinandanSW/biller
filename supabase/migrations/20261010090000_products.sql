-- Products: the catalogue the order screen picks items from.
--
-- Order items keep their own copy of name, HSN, unit, rate and GST (spec §25),
-- so editing or archiving a product never changes past orders or invoices.
-- order_items.product_id only records where an item came from.
-- Like customers, products are never deleted — they're archived.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),

  name text not null check (char_length(trim(name)) between 1 and 300),
  -- Optional SKU / item code, unique per organization.
  code text check (char_length(trim(code)) between 1 and 40),
  description text check (char_length(description) <= 1000),
  hsn_code text check (hsn_code ~ '^[0-9]{4,8}$'),
  unit text not null default 'pcs' check (char_length(trim(unit)) between 1 and 20),
  -- Selling price per unit. Includes GST when the organization's prices do.
  price numeric(16, 4) not null check (price >= 0),
  tax_rate numeric(5, 2) not null check (tax_rate between 0 and 100),
  -- Object in the organization-files bucket, under this organization's products/ area.
  image_path text check (
    image_path like 'organizations/' || organization_id::text || '/products/%'
  ),

  status public.record_status not null default 'ACTIVE',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, id)
);

create unique index products_code_idx on public.products (organization_id, lower(code))
  where code is not null;
create index products_listing_idx on public.products (organization_id, status, name);
create index products_name_search_idx on public.products using gin (name extensions.gin_trgm_ops);

create trigger set_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger audit after insert or update on public.products
  for each row execute function private.audit_row();

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;

-- Written directly (with RLS); organization_id is insert-only. The server picks
-- the id so the image can be uploaded under it before the row exists.
grant select on public.products to authenticated;
grant insert (
  id, organization_id, name, code, description, hsn_code, unit, price, tax_rate, image_path
) on public.products to authenticated;
grant update (
  name, code, description, hsn_code, unit, price, tax_rate, image_path, status
) on public.products to authenticated;

create policy "Members with products.view can view products" on public.products
  for select to authenticated
  using (private.has_permission(organization_id, 'products.view'));
create policy "Members with products.create can add products" on public.products
  for insert to authenticated
  with check (private.has_permission(organization_id, 'products.create'));
create policy "Members with products.update can edit products" on public.products
  for update to authenticated
  using (private.has_permission(organization_id, 'products.update'))
  with check (private.has_permission(organization_id, 'products.update'));

-- ---------------------------------------------------------------------------
-- Link order items to the product they were picked from
-- ---------------------------------------------------------------------------

alter table public.order_items add column product_id uuid;
alter table public.order_items
  add constraint order_items_product_fkey
  foreign key (organization_id, product_id) references public.products (organization_id, id);
create index order_items_product_idx on public.order_items (organization_id, product_id)
  where product_id is not null;

-- Same as before, plus product_id on items.
create or replace function public.save_order(
  p_actor_id uuid,
  p_organization_id uuid,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb,
  p_charges jsonb,
  p_confirm boolean
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_customer public.customers;
  v_date date := (p_order ->> 'order_date')::date;
  v_now timestamptz := now();
begin
  -- Attribute audit log entries in this transaction to the acting user.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_actor_id)::text, true);

  if p_order_id is null then
    if not private.user_has_permission(p_actor_id, p_organization_id, 'orders.create') then
      raise exception 'You do not have permission to create orders' using errcode = '42501';
    end if;
  elsif not private.user_has_permission(p_actor_id, p_organization_id, 'orders.update') then
    raise exception 'You do not have permission to edit orders' using errcode = '42501';
  end if;

  select * into v_customer from public.customers
  where id = (p_order ->> 'customer_id')::uuid and organization_id = p_organization_id;
  if not found then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'An order must have at least one item' using errcode = '22023';
  end if;

  if p_order_id is null then
    insert into public.orders (
      organization_id, order_number, status, order_date, customer_id, customer_name,
      customer_gstin, customer_phone, customer_email, billing_address, place_of_supply,
      supply_type, prices_include_tax, order_discount_type, order_discount_value, notes,
      subtotal, line_discount_total, order_discount_total, discount_total, charge_total,
      taxable_amount, cgst_total, sgst_total, igst_total, tax_total, rounding_adjustment,
      grand_total, tax_summary, created_by, confirmed_at
    )
    select
      p_organization_id,
      private.next_document_number(p_organization_id, 'ORDER', v_date),
      case when p_confirm then 'CONFIRMED'::public.order_status else 'DRAFT' end,
      v_date, v_customer.id, v_customer.name, v_customer.gstin, v_customer.phone,
      v_customer.email,
      jsonb_build_object(
        'line1', v_customer.billing_line1, 'line2', coalesce(v_customer.billing_line2, ''),
        'city', v_customer.billing_city, 'stateCode', v_customer.billing_state_code,
        'pincode', coalesce(v_customer.billing_pincode, '')
      ),
      v_customer.billing_state_code,
      o.supply_type, o.prices_include_tax, o.order_discount_type, o.order_discount_value,
      o.notes, o.subtotal, o.line_discount_total, o.order_discount_total, o.discount_total,
      o.charge_total, o.taxable_amount, o.cgst_total, o.sgst_total, o.igst_total, o.tax_total,
      o.rounding_adjustment, o.grand_total, coalesce(p_order -> 'tax_summary', '[]'),
      p_actor_id,
      case when p_confirm then v_now end
    from jsonb_populate_record(null::public.orders, p_order) o
    returning * into v_order;
  else
    select * into v_order from public.orders
    where id = p_order_id and organization_id = p_organization_id
    for update;
    if not found then
      raise exception 'Order not found' using errcode = 'P0002';
    end if;
    if v_order.status <> 'DRAFT' then
      raise exception 'Only draft orders can be edited' using errcode = '22023';
    end if;

    update public.orders t set
      status = case when p_confirm then 'CONFIRMED'::public.order_status else 'DRAFT' end,
      order_date = v_date,
      customer_id = v_customer.id,
      customer_name = v_customer.name,
      customer_gstin = v_customer.gstin,
      customer_phone = v_customer.phone,
      customer_email = v_customer.email,
      billing_address = jsonb_build_object(
        'line1', v_customer.billing_line1, 'line2', coalesce(v_customer.billing_line2, ''),
        'city', v_customer.billing_city, 'stateCode', v_customer.billing_state_code,
        'pincode', coalesce(v_customer.billing_pincode, '')
      ),
      place_of_supply = v_customer.billing_state_code,
      supply_type = o.supply_type,
      prices_include_tax = o.prices_include_tax,
      order_discount_type = o.order_discount_type,
      order_discount_value = o.order_discount_value,
      notes = o.notes,
      subtotal = o.subtotal,
      line_discount_total = o.line_discount_total,
      order_discount_total = o.order_discount_total,
      discount_total = o.discount_total,
      charge_total = o.charge_total,
      taxable_amount = o.taxable_amount,
      cgst_total = o.cgst_total,
      sgst_total = o.sgst_total,
      igst_total = o.igst_total,
      tax_total = o.tax_total,
      rounding_adjustment = o.rounding_adjustment,
      grand_total = o.grand_total,
      tax_summary = coalesce(p_order -> 'tax_summary', '[]'),
      confirmed_at = case when p_confirm then v_now end
    from jsonb_populate_record(null::public.orders, p_order) o
    where t.id = v_order.id
    returning t.* into v_order;

    delete from public.order_items where order_id = v_order.id;
    delete from public.order_charges where order_id = v_order.id;
  end if;

  -- The composite foreign key rejects a product from another organization.
  insert into public.order_items (
    organization_id, order_id, position, product_id, name, hsn_code, quantity, unit, rate,
    discount_percent, tax_rate, gross_amount, line_discount, order_discount_share,
    taxable_amount, cgst, sgst, igst, tax_amount, line_total
  )
  select
    p_organization_id, v_order.id, e.position::integer, i.product_id, i.name, i.hsn_code,
    i.quantity, i.unit, i.rate, i.discount_percent, i.tax_rate, i.gross_amount,
    i.line_discount, i.order_discount_share, i.taxable_amount, i.cgst, i.sgst, i.igst,
    i.tax_amount, i.line_total
  from jsonb_array_elements(p_items) with ordinality as e (value, position),
    jsonb_populate_record(null::public.order_items, e.value) i;

  insert into public.order_charges (
    organization_id, order_id, position, label, amount, tax_rate, cgst, sgst, igst,
    tax_amount, total
  )
  select
    p_organization_id, v_order.id, e.position::integer, c.label, c.amount,
    c.tax_rate, c.cgst, c.sgst, c.igst, c.tax_amount, c.total
  from jsonb_array_elements(p_charges) with ordinality as e (value, position),
    jsonb_populate_record(null::public.order_charges, e.value) c;

  return v_order;
end;
$$;
