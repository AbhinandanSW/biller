-- Private share links: /share/{share_token} lets a customer open their order
-- or invoice PDF without an account. The token is random (122 bits), so it
-- can't be guessed; knowing it is the permission.

alter table public.orders
  add column share_token uuid not null default gen_random_uuid();

create unique index orders_share_token_idx on public.orders (share_token);
