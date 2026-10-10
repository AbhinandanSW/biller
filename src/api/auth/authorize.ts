import "server-only";

import type { OrganizationContext, Permission } from "@/types/auth";
import { roleHasPermission } from "@/utils/permissions";

import { requireOrganization } from "./session";

/**
 * The organization context if the user holds `permission`, otherwise null.
 * RLS enforces the same rule in the database; checking here gives a clear
 * message instead of a silent no-op.
 */
export async function authorize(permission: Permission): Promise<OrganizationContext | null> {
  const context = await requireOrganization();
  return roleHasPermission(context.role, permission) ? context : null;
}
