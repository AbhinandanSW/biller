-- LOCAL DEVELOPMENT SEED — runs after `pnpm db:reset`. Never run in production.
--
-- Demo login:  owner@example.com / Demo12345
-- It owns "ABC Distributors" (Punjab) with a few customers. Orders are
-- created through the app so their totals come from the calculation engine.

do $$
declare
  v_user_id uuid := '11111111-1111-4111-8111-111111111111';
  v_org_id uuid := '22222222-2222-4222-8222-222222222222';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    -- GoTrue expects these to be empty strings, not null.
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    'owner@example.com', extensions.crypt('Demo12345', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Owner"}', now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', 'owner@example.com', 'email_verified', true),
    now(), now(), now()
  );

  insert into public.organizations (
    id, name, legal_name, gstin, email, phone, address_line_1, city, state_code, pincode, created_by
  ) values (
    v_org_id, 'ABC Distributors', 'ABC Distributors Pvt Ltd', '03AAACA1234A1Z5',
    'accounts@abcdistributors.in', '0161 400 1234', '45, Industrial Area Phase 2', 'Ludhiana',
    '03', '141003', v_user_id
  );
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'owner');

  insert into public.customers (
    organization_id, code, name, contact_person, phone, email, gstin,
    billing_line1, billing_city, billing_state_code, billing_pincode,
    shipping_same_as_billing, shipping_line1, shipping_city, shipping_state_code, shipping_pincode,
    notes, created_by
  ) values
    (v_org_id, 'CUS-001', 'Sharma Traders', 'Rakesh Sharma', '98140 12345', 'accounts@sharmatraders.in',
     '03ABCFS1234C1Z5', '12, Grain Market', 'Ludhiana', '03', '141008', true, null, null, null, null,
     'Pays within 15 days.', v_user_id),
    (v_org_id, 'CUS-002', 'XYZ Retail', 'Simran Kaur', '98722 45678', 'purchase@xyzretail.in',
     '03AAECX5678D1Z2', 'SCO 45, Ranjit Avenue', 'Amritsar', '03', '143001', false,
     'Warehouse 3, GT Road', 'Amritsar', '03', '143105', null, v_user_id),
    (v_org_id, 'CUS-003', 'Gupta & Sons', 'Anil Gupta', '94160 33221', null,
     '06AAFFG4321H1Z8', 'Railway Road', 'Karnal', '06', '132001', true, null, null, null, null,
     null, v_user_id),
    (v_org_id, 'CUS-004', 'Delhi Wholesale Mart', 'Vikas Jain', '98100 77889', 'orders@dwmart.in',
     '07AAACD9876E1Z3', 'Plot 8, Naya Bazar', 'New Delhi', '07', '110006', true, null, null, null, null,
     'Delivery only before 11 am.', v_user_id),
    (v_org_id, 'CUS-005', 'Mehta Enterprises', 'Priya Mehta', '98220 55443', 'priya@mehtaent.in',
     '27AABFM1111K1Z4', 'Office 204, FC Road', 'Pune', '27', '411004', true, null, null, null, null,
     null, v_user_id),
    (v_org_id, null, 'Kaur Kitchen Supplies', 'Harpreet Kaur', '97800 11223', null,
     null, 'Model Town', 'Jalandhar', '03', '144003', true, null, null, null, null,
     'Unregistered — no GSTIN.', v_user_id);
end $$;
