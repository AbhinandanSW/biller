-- History of invoices and orders sent to customers by email or WhatsApp.
-- Rows are written by the server (service role) around each send attempt;
-- members can read them. They're never edited by users or deleted.

create type public.send_channel as enum ('EMAIL', 'WHATSAPP');
create type public.send_status as enum ('SENDING', 'SENT', 'FAILED');

create table public.document_sends (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  document_type text not null check (document_type in ('INVOICE', 'ORDER')),
  -- The invoice or order number that was sent.
  document_number text not null,
  channel public.send_channel not null,
  recipient text not null check (char_length(recipient) between 3 and 320),
  subject text check (char_length(subject) <= 300),
  message text check (char_length(message) <= 5000),
  status public.send_status not null default 'SENDING',
  provider_message_id text,
  error text check (char_length(error) <= 1000),
  sent_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  foreign key (organization_id, order_id) references public.orders (organization_id, id)
);

create index document_sends_order_idx on public.document_sends (order_id, created_at desc);
-- For rate limiting: sends per organization in the last hour.
create index document_sends_org_recent_idx on public.document_sends (organization_id, created_at desc);

create trigger set_updated_at before update on public.document_sends
  for each row execute function private.set_updated_at();

alter table public.document_sends enable row level security;
revoke all on public.document_sends from anon, authenticated;
grant select on public.document_sends to authenticated;

create policy "Members with orders.view can view send history" on public.document_sends
  for select to authenticated
  using (private.has_permission(organization_id, 'orders.view'));
