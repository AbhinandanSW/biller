import type { ORDER_FILTERS } from "@/constants/orders";

import type { OrderCalculation, RoundingSettings, SupplyType } from "./calculation";
import type { Address } from "./customer";

export interface OrderItem {
  id: string;
  /** The catalogue product this row was picked from; null for a typed-in item. */
  productId: string | null;
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
export type PaymentState = "NOT_INVOICED" | "UNPAID" | "OVERDUE" | "PAID" | "CANCELLED";
export type OrderDiscountType = "PERCENTAGE" | "FIXED";

/** Which document an order is shown or sent as. */
export type DocumentKind = "invoice" | "order";

/** Key of ORDER_FILTERS, from `?show=` on the orders list. */
export type OrderFilter = keyof typeof ORDER_FILTERS;

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
  orderDiscount: { type: OrderDiscountType; value: string };
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
  paymentState: PaymentState;
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

export type SaveOrderResult = { id: string; number: string } | { error: string };

export type EnsureInvoiceResult =
  { number: string; dueDate: string; issued: boolean } | { error: string };

/** A send of an order or invoice by email or WhatsApp. */
export interface DocumentSend {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  documentType: "INVOICE" | "ORDER";
  documentNumber: string;
  recipient: string;
  status: "SENDING" | "SENT" | "FAILED";
  error: string | null;
  sentByName: string | null;
  createdAt: string;
}

/** Details that fill the share/send message templates. */
export interface ShareDetails {
  kind: DocumentKind;
  number: string;
  customerName: string;
  businessName: string;
  grandTotal: string;
  dueDate?: string | null;
  /** Omit when the PDF is attached (email) so the message doesn't need a link. */
  link?: string;
}

// ---------------------------------------------------------------------------
// Draft calculation (order editor and saveOrder)
// ---------------------------------------------------------------------------

export interface DraftForCalculation {
  items: OrderItem[];
  orderDiscount: Order["orderDiscount"];
  charges: OrderCharge[];
  pricesIncludeTax: boolean;
}

export interface CalculationContext {
  sellerStateCode: string;
  placeOfSupplyStateCode: string;
  gstEnabled: boolean;
  rounding: RoundingSettings;
}

export interface DraftCalculation {
  /** Null until at least one valid item exists. */
  totals: OrderCalculation | null;
  /** Per-item problems, keyed by item id. */
  itemErrors: Record<string, string>;
  /** Order-level problem, e.g. a discount bigger than the order. */
  error: string | null;
}

/** Which send channels are set up; null when the user can't send. */
export type SendingChannels = { email: boolean; whatsapp: boolean } | null;

export type SendChannel = DocumentSend["channel"];
