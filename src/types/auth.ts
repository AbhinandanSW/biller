import type { PERMISSIONS, ROLES } from "@/constants/permissions";

import type { Organization } from "./organization";

export type Role = (typeof ROLES)[number];
export type Permission = (typeof PERMISSIONS)[number];

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface Membership {
  role: Role;
  organization: Organization;
}

/** The signed-in user and the organization they're working in. */
export interface OrganizationContext extends Membership {
  user: CurrentUser;
  memberships: Membership[];
}
