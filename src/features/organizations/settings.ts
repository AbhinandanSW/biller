import type { Organization } from "@/lib/auth/session";

import type { OrganizationSettings } from "./OrganizationProvider";

/** Database row → the settings screens and the calculation engine use. */
export function toOrganizationSettings(org: Organization): OrganizationSettings {
  return {
    id: org.id,
    name: org.name,
    legalName: org.legal_name,
    gstin: org.gstin,
    stateCode: org.state_code,
    email: org.email,
    phone: org.phone,
    address:
      [org.address_line_1, org.address_line_2, org.city, org.pincode].filter(Boolean).join(", ") ||
      null,
    gstEnabled: org.gst_enabled,
    pricesIncludeTax: org.prices_include_tax,
    defaultTaxRate: Number(org.default_tax_rate),
    rounding: {
      mode: org.rounding_mode === "HALF_EVEN" ? "HALF_EVEN" : "HALF_UP",
      taxRounding: org.tax_rounding === "PER_INVOICE" ? "PER_INVOICE" : "PER_LINE",
      roundGrandTotal: org.round_grand_total,
    },
    orderPrefix: org.order_prefix,
    invoicePrefix: org.invoice_prefix,
  };
}
