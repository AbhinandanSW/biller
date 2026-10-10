"use client";

import { useContext } from "react";

import { OrganizationContext } from "@/app/components/providers/OrganizationProvider";
import type { OrganizationSettings } from "@/types/organization";

/** The current business. Only works inside the dashboard layout. */
export function useOrganization(): OrganizationSettings {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error("useOrganization must be used inside the dashboard layout");
  return value;
}
