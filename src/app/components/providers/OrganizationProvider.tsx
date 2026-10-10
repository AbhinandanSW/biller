"use client";

import { createContext, type ReactNode } from "react";

import type { OrganizationSettings } from "@/types/organization";

export const OrganizationContext = createContext<OrganizationSettings | null>(null);

/** Makes the current business available to client components via useOrganization(). */
export function OrganizationProvider({
  value,
  children,
}: {
  value: OrganizationSettings;
  children: ReactNode;
}) {
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
