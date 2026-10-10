/**
 * Mirrors public.role_permissions (supabase/migrations/*_organizations.sql).
 * The database is the source of truth and enforces these through RLS; this
 * copy is for server-side checks and hiding UI the user can't use. A test
 * fails if the two drift apart.
 */

import type { Permission, Role } from "@/types/auth";

export const ROLES = ["owner", "admin", "manager", "sales", "viewer"] as const;

export const PERMISSIONS = [
  "organization.view",
  "organization.update",
  "members.view",
  "members.manage",
  "audit.view",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.delete",
  "pricing.view",
  "pricing.manage",
  "orders.view",
  "orders.create",
  "orders.update",
  "orders.cancel",
  "orders.delete",
  "invoices.view",
  "invoices.create",
  "invoices.send",
  "invoices.cancel",
  "reports.view",
] as const;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  // Admins hold every permission; ownership changes are restricted separately.
  admin: PERMISSIONS,
  manager: [
    "organization.view",
    "members.view",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "customers.view",
    "customers.create",
    "customers.update",
    "customers.delete",
    "pricing.view",
    "pricing.manage",
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.cancel",
    "invoices.view",
    "invoices.create",
    "invoices.send",
    "reports.view",
  ],
  sales: [
    "organization.view",
    "products.view",
    "customers.view",
    "pricing.view",
    "orders.view",
    "orders.create",
    "orders.update",
    "invoices.view",
  ],
  viewer: [
    "organization.view",
    "members.view",
    "products.view",
    "customers.view",
    "pricing.view",
    "orders.view",
    "invoices.view",
    "reports.view",
  ],
};
