-- Sales: customers, orders (with items and charges), invoices and document
-- numbering.
--
-- Money rules (spec §58, §77):
--   * Order totals are calculated on the server with the TypeScript engine
--     (src/lib/calculations) and written through public.save_order, which
--     only the service role can call. Signed-in users can never write totals.
--   * Confirmed orders and issued invoices are immutable; corrections are
--     cancellations (and, later, credit notes).
--   * Nothing is deleted. Customers are archived; orders are cancelled.

create extension if not exists pg_trgm with schema extensions;

create type public.record_status as enum ('ACTIVE', 'ARCHIVED');
create type public.order_status as enum ('DRAFT', 'CONFIRMED', 'CANCELLED');
create type public.invoice_status as enum ('ISSUED', 'PAID', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),

  code text check (char_length(trim(code)) between 1 and 20),
  name text not null check (char_length(trim(name)) between 1 and 200),
  contact_person text check (char_length(contact_person) <= 100),
  phone text check (phone ~ '^[+0-9 ()-]{7,20}$'),
  email text check (char_length(email) <= 320 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  gstin text check (
    gstin = upper(gstin) and gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'
  ),

  billing_line1 text not null check (char_length(trim(billing_line1)) between 1 and 200),
  billing_line2 text check (char_length(billing_line2) <= 200),
  billing_city text not null check (char_length(trim(billing_city)) between 1 and 100),
  -- Place of supply: decides CGST + SGST (same state as seller) or IGST.
  billing_state_code text not null check (billing_state_code ~ '^[0-9]{2}$'),
  billing_pincode text check (billing_pincode ~ '^[1-9][0-9]{5}$'),

  shipping_same_as_billing boolean not null default true,
  shipping_line1 text check (char_length(shipping_line1) <= 200),
  shipping_line2 text check (char_length(shipping_line2) <= 200),
  shipping_city text check (char_length(shipping_city) <= 100),
  shipping_state_code text check (shipping_state_code ~ '^[0-9]{2}$'),
  shipping_pincode text check (shipping_pincode ~ '^[1-9][0-9]{5}$'),

  notes text check (char_length(notes) <= 1000),
  status public.record_status not null default 'ACTIVE',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, id),
  -- A GSTIN is registered in one state; the billing address must be there.
  constraint customers_gstin_state_check
    check (gstin is null or left(gstin, 2) = billing_state_code),
  constraint customers_shipping_check check (
    shipping_same_as_billing
    or (shipping_line1 is not null and shipping_city is not null and shipping_state_code is not null)
  )
);

create unique index customers_code_idx on public.customers (organization_id, lower(code))
  where code is not null;
create index customers_listing_idx on public.customers (organization_id, status, name);
create index customers_name_search_idx on public.customers using gin (name extensions.gin_trgm_ops);
create index customers_phone_idx on public.customers (organization_id, phone);

create trigger set_updated_at before update on public.customers
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Document numbering (ORD-2026-000001, INV-2026-000001)
-- ---------------------------------------------------------------------------

create table public.document_sequences (
  organization_id uuid not null references public.organizations (id),
  document_type text not null check (document_type in ('ORDER', 'INVOICE')),
  year integer not null,
  last_value integer not null default 0,
  primary key (organization_id, document_type, year)
);

-- Next number for a document. The upsert takes a row lock, so concurrent
-- calls in different transactions can never get the same number.
create function private.next_document_number(
  p_organization_id uuid,
  p_document_type text,
  p_date date
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_year integer := extract(year from p_date);
  v_value integer;
  v_prefix text;
begin
  insert into public.document_sequences (organization_id, document_type, year, last_value)
  values (p_organization_id, p_document_type, v_year, 1)
  on conflict (organization_id, document_type, year)
  do update set last_value = public.document_sequences.last_value + 1
  returning last_value into v_value;

  select case p_document_type when 'ORDER' then order_prefix else invoice_prefix end
  into v_prefix
  from public.organizations
  where id = p_organization_id;

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_value::text, 6, '0'));
end;
$$;
revoke all on function private.next_document_number(uuid, text, date) from public;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  order_number text not null,
  status public.order_status not null default 'DRAFT',
  order_date date not null,

  customer_id uuid not null,
  -- Snapshot of the customer when the order was saved (spec §25).
  customer_name text not null,
  customer_gstin text,
  customer_phone text,
  customer_email text,
  billing_address jsonb not null,
  place_of_supply text not null check (place_of_supply ~ '^[0-9]{2}$'),
  supply_type text not null check (supply_type in ('INTRA_STATE', 'INTER_STATE')),
  prices_include_tax boolean not null,

  order_discount_type text not null default 'PERCENTAGE'
    check (order_discount_type in ('PERCENTAGE', 'FIXED')),
  order_discount_value numeric(14, 2) check (order_discount_value >= 0),
  notes text check (char_length(notes) <= 2000),

  subtotal numeric(14, 2) not null,
  line_discount_total numeric(14, 2) not null,
  order_discount_total numeric(14, 2) not null,
  discount_total numeric(14, 2) not null,
  charge_total numeric(14, 2) not null,
  taxable_amount numeric(14, 2) not null,
  cgst_total numeric(14, 2) not null,
  sgst_total numeric(14, 2) not null,
  igst_total numeric(14, 2) not null,
  tax_total numeric(14, 2) not null,
  rounding_adjustment numeric(14, 2) not null,
  grand_total numeric(14, 2) not null check (grand_total >= 0),
  -- Per-GST-rate breakdown for the invoice's tax summary.
  tax_summary jsonb not null default '[]',

  created_by uuid references auth.users (id) on delete set null,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, id),
  unique (organization_id, order_number),
  foreign key (organization_id, customer_id) references public.customers (organization_id, id)
);

create index orders_listing_idx on public.orders (organization_id, order_date desc, order_number desc);
create index orders_customer_idx on public.orders (organization_id, customer_id);
create index orders_status_idx on public.orders (organization_id, status);

create trigger set_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  position integer not null,

  name text not null check (char_length(trim(name)) between 1 and 300),
  hsn_code text check (char_length(hsn_code) <= 8),
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null check (char_length(unit) <= 20),
  rate numeric(16, 4) not null check (rate >= 0),
  discount_percent numeric(5, 2) check (discount_percent between 0 and 100),
  tax_rate numeric(5, 2) not null check (tax_rate between 0 and 100),

  gross_amount numeric(14, 2) not null,
  line_discount numeric(14, 2) not null,
  order_discount_share numeric(14, 2) not null,
  taxable_amount numeric(14, 2) not null,
  cgst numeric(14, 2) not null,
  sgst numeric(14, 2) not null,
  igst numeric(14, 2) not null,
  tax_amount numeric(14, 2) not null,
  line_total numeric(14, 2) not null,

  foreign key (organization_id, order_id) references public.orders (organization_id, id)
    on delete cascade,
  unique (order_id, position)
);

create table public.order_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  position integer not null,
  label text not null check (char_length(trim(label)) between 1 and 100),
  amount numeric(14, 2) not null check (amount >= 0),
  -- Null for a non-taxable charge.
  tax_rate numeric(5, 2) check (tax_rate between 0 and 100),
  cgst numeric(14, 2) not null,
  sgst numeric(14, 2) not null,
  igst numeric(14, 2) not null,
  tax_amount numeric(14, 2) not null,
  total numeric(14, 2) not null,

  foreign key (organization_id, order_id) references public.orders (organization_id, id)
    on delete cascade,
  unique (order_id, position)
);

-- Item names used before, for autocomplete on the order screen.
create index order_items_name_idx on public.order_items (organization_id, lower(name));

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  status public.invoice_status not null default 'ISSUED',
  paid_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (organization_id, order_id) references public.orders (organization_id, id),
  -- One invoice per order for now; credit notes will handle corrections.
  unique (order_id),
  unique (organization_id, invoice_number),
  check (due_date >= invoice_date)
);

create trigger set_updated_at before update on public.invoices
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.document_sequences enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_charges enable row level security;
alter table public.invoices enable row level security;

revoke all on public.customers, public.document_sequences, public.orders, public.order_items,
  public.order_charges, public.invoices from anon, authenticated;

-- Customers are written directly (with RLS); organization_id is insert-only.
grant select on public.customers to authenticated;
grant insert (
  organization_id, code, name, contact_person, phone, email, gstin,
  billing_line1, billing_line2, billing_city, billing_state_code, billing_pincode,
  shipping_same_as_billing, shipping_line1, shipping_line2, shipping_city,
  shipping_state_code, shipping_pincode, notes
) on public.customers to authenticated;
grant update (
  code, name, contact_person, phone, email, gstin,
  billing_line1, billing_line2, billing_city, billing_state_code, billing_pincode,
  shipping_same_as_billing, shipping_line1, shipping_line2, shipping_city,
  shipping_state_code, shipping_pincode, notes, status
) on public.customers to authenticated;

-- Orders and invoices are read-only to users; every write goes through the
-- functions below.
grant select on public.orders, public.order_items, public.order_charges, public.invoices
  to authenticated;

create policy "Members with customers.view can view customers" on public.customers
  for select to authenticated
  using (private.has_permission(organization_id, 'customers.view'));
create policy "Members with customers.create can add customers" on public.customers
  for insert to authenticated
  with check (private.has_permission(organization_id, 'customers.create'));
create policy "Members with customers.update can edit customers" on public.customers
  for update to authenticated
  using (private.has_permission(organization_id, 'customers.update'))
  with check (private.has_permission(organization_id, 'customers.update'));

create policy "Members with orders.view can view orders" on public.orders
  for select to authenticated
  using (private.has_permission(organization_id, 'orders.view'));
create policy "Members with orders.view can view order items" on public.order_items
  for select to authenticated
  using (private.has_permission(organization_id, 'orders.view'));
create policy "Members with orders.view can view order charges" on public.order_charges
  for select to authenticated
  using (private.has_permission(organization_id, 'orders.view'));
create policy "Members with invoices.view can view invoices" on public.invoices
  for select to authenticated
  using (private.has_permission(organization_id, 'invoices.view'));

-- ---------------------------------------------------------------------------
-- Summary views (security_invoker, so RLS on the base tables applies)
-- ---------------------------------------------------------------------------

-- One row per order with its invoice and payment state, for lists and search.
create view public.order_list with (security_invoker = true) as
select
  o.id,
  o.organization_id,
  o.order_number,
  o.status,
  o.order_date,
  o.customer_id,
  o.customer_name,
  o.customer_phone,
  o.customer_gstin,
  o.grand_total,
  o.created_at,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.status as invoice_status,
  case
    when i.id is null then 'NOT_INVOICED'
    when i.status = 'CANCELLED' then 'CANCELLED'
    when i.status = 'PAID' then 'PAID'
    when i.due_date < current_date then 'OVERDUE'
    else 'UNPAID'
  end as payment_state,
  (select count(*) from public.order_items it where it.order_id = o.id)::integer as item_count,
  (select string_agg(it.name, ' ' order by it.position) from public.order_items it
    where it.order_id = o.id) as item_names
from public.orders o
left join public.invoices i on i.order_id = o.id;

-- Per-customer totals: revenue counts invoiced (not cancelled) orders.
create view public.customer_summaries with (security_invoker = true) as
select
  c.id as customer_id,
  c.organization_id,
  count(o.id) filter (where o.status = 'CONFIRMED')::integer as order_count,
  coalesce(sum(o.grand_total) filter (where i.status in ('ISSUED', 'PAID')), 0) as revenue,
  coalesce(sum(o.grand_total) filter (where i.status = 'ISSUED'), 0) as outstanding,
  count(i.id) filter (where i.status in ('ISSUED', 'PAID'))::integer as invoiced_count,
  max(o.order_date) filter (where o.status = 'CONFIRMED') as last_order_date
from public.customers c
left join public.orders o on o.customer_id = c.id
left join public.invoices i on i.order_id = o.id
group by c.id, c.organization_id;

grant select on public.order_list, public.customer_summaries to authenticated;

-- ---------------------------------------------------------------------------
-- Order functions
-- ---------------------------------------------------------------------------

-- Permission check for an explicit user — used by functions the server calls
-- on a user's behalf with the service role (where auth.uid() is null).
create function private.user_has_permission(
  p_user_id uuid,
  p_organization_id uuid,
  p_permission text
)
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
      and m.user_id = p_user_id
      and rp.permission = p_permission
  );
$$;
revoke all on function private.user_has_permission(uuid, uuid, text) from public;

-- Creates an order or replaces a draft, with its items and charges, in one
-- transaction. `p_order` carries values already calculated by the server's
-- calculation engine, so this is callable by the service role only.
create function public.save_order(
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

  insert into public.order_items (
    organization_id, order_id, position, name, hsn_code, quantity, unit, rate,
    discount_percent, tax_rate, gross_amount, line_discount, order_discount_share,
    taxable_amount, cgst, sgst, igst, tax_amount, line_total
  )
  select
    p_organization_id, v_order.id, e.position::integer, i.name, i.hsn_code,
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

-- Status changes don't touch totals, so signed-in users call these directly.

create function public.confirm_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not private.has_permission(v_order.organization_id, 'orders.update') then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_order.status <> 'DRAFT' then
    raise exception 'Only drafts can be confirmed' using errcode = '22023';
  end if;
  update public.orders set status = 'CONFIRMED', confirmed_at = now()
  where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

create function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_invoice public.invoices;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not private.has_permission(v_order.organization_id, 'orders.cancel') then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_order.status = 'CANCELLED' then
    raise exception 'This order is already cancelled' using errcode = '22023';
  end if;

  select * into v_invoice from public.invoices where order_id = p_order_id for update;
  if found and v_invoice.status = 'PAID' then
    raise exception 'A paid order can''t be cancelled' using errcode = '22023';
  end if;
  if found then
    update public.invoices set status = 'CANCELLED' where id = v_invoice.id;
  end if;

  update public.orders set status = 'CANCELLED', cancelled_at = now()
  where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

-- Issues the invoice for a confirmed order with the next invoice number.
create function public.generate_invoice(p_order_id uuid, p_due_days integer default 15)
returns public.invoices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_invoice public.invoices;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not private.has_permission(v_order.organization_id, 'invoices.create') then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_order.status <> 'CONFIRMED' then
    raise exception 'Confirm the order before invoicing it' using errcode = '22023';
  end if;
  if exists (select 1 from public.invoices where order_id = p_order_id) then
    raise exception 'This order already has an invoice' using errcode = '23505';
  end if;
  if p_due_days not between 0 and 365 then
    raise exception 'Payment terms must be 0–365 days' using errcode = '22023';
  end if;

  insert into public.invoices (organization_id, order_id, invoice_number, invoice_date, due_date)
  values (
    v_order.organization_id,
    v_order.id,
    private.next_document_number(v_order.organization_id, 'INVOICE', current_date),
    current_date,
    current_date + p_due_days
  )
  returning * into v_invoice;
  return v_invoice;
end;
$$;

create function public.set_invoice_paid(p_order_id uuid, p_paid boolean)
returns public.invoices
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.invoices;
begin
  select * into v_invoice from public.invoices where order_id = p_order_id for update;
  if not found or not private.has_permission(v_invoice.organization_id, 'invoices.create') then
    raise exception 'Invoice not found' using errcode = 'P0002';
  end if;
  if v_invoice.status = 'CANCELLED' then
    raise exception 'This invoice was cancelled' using errcode = '22023';
  end if;
  update public.invoices
  set status = case when p_paid then 'PAID'::public.invoice_status else 'ISSUED' end,
      paid_at = case when p_paid then now() end
  where id = v_invoice.id
  returning * into v_invoice;
  return v_invoice;
end;
$$;

revoke all on function public.save_order(uuid, uuid, uuid, jsonb, jsonb, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.save_order(uuid, uuid, uuid, jsonb, jsonb, jsonb, boolean)
  to service_role;

revoke all on function public.confirm_order(uuid) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.generate_invoice(uuid, integer) from public, anon;
revoke all on function public.set_invoice_paid(uuid, boolean) from public, anon;
grant execute on function public.confirm_order(uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.generate_invoice(uuid, integer) to authenticated;
grant execute on function public.set_invoice_paid(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

create trigger audit after insert or update on public.customers
  for each row execute function private.audit_row();
create trigger audit after insert or update on public.orders
  for each row execute function private.audit_row();
create trigger audit after insert or update on public.invoices
  for each row execute function private.audit_row();
