"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { RoundingSettings } from "@/lib/calculations";

/** What client screens need to know about the current business. */
export interface OrganizationSettings {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  stateCode: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstEnabled: boolean;
  pricesIncludeTax: boolean;
  defaultTaxRate: number;
  rounding: RoundingSettings;
  orderPrefix: string;
  invoicePrefix: string;
}

const OrganizationContext = createContext<OrganizationSettings | null>(null);

export function OrganizationProvider({
  value,
  children,
}: {
  value: OrganizationSettings;
  children: ReactNode;
}) {
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationSettings {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error("useOrganization must be used inside the dashboard layout");
  return value;
}
