import type { Customer, CustomerInput, CustomerStats } from "@/types/customer";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
type CustomerRow = Tables["customers"]["Row"];
type SummaryRow = Database["public"]["Views"]["customer_summaries"]["Row"];

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    gstin: row.gstin,
    billing: {
      line1: row.billing_line1,
      line2: row.billing_line2 ?? "",
      city: row.billing_city,
      stateCode: row.billing_state_code,
      pincode: row.billing_pincode ?? "",
    },
    shippingSameAsBilling: row.shipping_same_as_billing,
    shipping: row.shipping_same_as_billing
      ? null
      : {
          line1: row.shipping_line1 ?? "",
          line2: row.shipping_line2 ?? "",
          city: row.shipping_city ?? "",
          stateCode: row.shipping_state_code ?? "",
          pincode: row.shipping_pincode ?? "",
        },
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** What the customer form saves → the columns it writes. */
export function toCustomerRow(c: CustomerInput) {
  return {
    code: c.code,
    name: c.name,
    contact_person: c.contactPerson,
    phone: c.phone,
    email: c.email,
    gstin: c.gstin,
    billing_line1: c.billing.line1,
    billing_line2: c.billing.line2 || null,
    billing_city: c.billing.city,
    billing_state_code: c.billing.stateCode,
    billing_pincode: c.billing.pincode || null,
    shipping_same_as_billing: c.shippingSameAsBilling,
    shipping_line1: c.shipping?.line1 || null,
    shipping_line2: c.shipping?.line2 || null,
    shipping_city: c.shipping?.city || null,
    shipping_state_code: c.shipping?.stateCode || null,
    shipping_pincode: c.shipping?.pincode || null,
    notes: c.notes,
  } satisfies Tables["customers"]["Update"];
}

export function toCustomerStats(row: SummaryRow | null | undefined): CustomerStats {
  const revenue = Number(row?.revenue ?? 0);
  const invoiced = row?.invoiced_count ?? 0;
  return {
    orderCount: row?.order_count ?? 0,
    revenue,
    outstanding: Number(row?.outstanding ?? 0),
    averageOrderValue: invoiced ? revenue / invoiced : 0,
    lastOrderDate: row?.last_order_date ?? null,
  };
}
