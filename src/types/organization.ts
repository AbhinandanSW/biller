import type { RoundingSettings } from "./calculation";
import type { Database } from "./database";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];

/** What screens and the calculation engine need to know about the current business. */
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
