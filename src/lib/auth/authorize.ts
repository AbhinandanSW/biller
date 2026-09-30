import "server-only";

import { roleHasPermission, type Permission } from "./permissions";
import { requireOrganization, type OrganizationContext } from "./session";

export const FORBIDDEN_MESSAGE = "You don't have permission to do that.";

/**
 * The organization context if the user holds `permission`, otherwise null.
 * RLS enforces the same rule in the database; checking here gives a clear
 * message instead of a silent no-op.
 */
export async function authorize(permission: Permission): Promise<OrganizationContext | null> {
  const context = await requireOrganization();
  return roleHasPermission(context.role, permission) ? context : null;
}
