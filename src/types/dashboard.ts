import type { OrderRow } from "./order";

export interface DashboardStats {
  salesThisMonth: number;
  ordersThisMonth: number;
  outstanding: number;
  overdueCount: number;
  draftCount: number;
  toInvoiceCount: number;
  recent: OrderRow[];
}

export interface TopCustomer {
  id: string;
  name: string;
  revenue: number;
  outstanding: number;
  orderCount: number;
}
