import type { OrderCalculation, SupplyType } from "@/lib/calculations";

import type { Address } from "../customers/types";

export interface OrderItem {
  id: string;
  name: string;
  hsnCode: string;
  quantity: string;
  unit: string;
  /** Rate per unit, as typed. */
  rate: string;
  /** Line discount in percent; empty for none. */
  discountPercent: string;
  taxRate: string;
}

export interface OrderCharge {
  id: string;
  label: string;
  amount: string;
  /** Empty for a non-taxable charge. */
  taxRate: string;
}

export type OrderStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type InvoiceStatus = "ISSUED" | "PAID" | "CANCELLED";

export interface Invoice {
  number: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAt: string | null;
}

export interface Order {
  id: string;
  number: string;
  /** Secret for the public /share/{token} link. */
  shareToken: string;
  status: OrderStatus;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  customerId: string;
  /** Copied at save time so the order doesn't change if the customer does. */
  customer: {
    name: string;
    gstin: string | null;
    phone: string | null;
    email: string | null;
    billing: Address;
  };
  items: OrderItem[];
  orderDiscount: { type: "PERCENTAGE" | "FIXED"; value: string };
  charges: OrderCharge[];
  notes: string;
  pricesIncludeTax: boolean;
  supplyType: SupplyType;
  /** Totals as calculated when the order was saved. */
  totals: OrderCalculation;
  invoice: Invoice | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

/** A row in order lists (from the order_list view). */
export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  date: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  grandTotal: number;
  invoiceNumber: string | null;
  paymentState: "NOT_INVOICED" | "UNPAID" | "OVERDUE" | "PAID" | "CANCELLED";
}

/** What the order screen submits. Totals are always recalculated on the server. */
export interface OrderInput {
  customerId: string;
  date: string;
  items: OrderItem[];
  orderDiscount: Order["orderDiscount"];
  charges: OrderCharge[];
  notes: string;
}
