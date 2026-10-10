export type CustomerStatus = "ACTIVE" | "ARCHIVED";
/** Status filter on the customers list. */
export type CustomerStatusFilter = CustomerStatus | "ALL";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  /** Two-digit GST state code — decides CGST+SGST vs IGST. */
  stateCode: string;
  pincode: string;
}

export interface Customer {
  id: string;
  /** Optional short code, e.g. CUS-001. */
  code: string | null;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  billing: Address;
  shippingSameAsBilling: boolean;
  shipping: Address | null;
  notes: string | null;
  status: CustomerStatus;
  createdAt: string;
}

/** What the customer form saves. */
export type CustomerInput = Omit<Customer, "id" | "status" | "createdAt">;

/** Per-customer totals (from the customer_summaries view). */
export interface CustomerStats {
  /** Confirmed orders (not drafts or cancelled). */
  orderCount: number;
  /** Invoiced amount, excluding cancelled invoices. */
  revenue: number;
  outstanding: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}

export type SaveCustomerResult =
  { id: string; name: string } | { error: string; field?: "code" | "gstin" };
