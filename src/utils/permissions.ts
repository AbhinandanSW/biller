import { ROLE_PERMISSIONS } from "@/constants/permissions";
import type { Permission, Role } from "@/types/auth";

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
