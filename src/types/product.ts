import type { CustomerStatus, CustomerStatusFilter } from "./customer";

export type ProductStatus = CustomerStatus;
export type ProductStatusFilter = CustomerStatusFilter;

export interface Product {
  id: string;
  name: string;
  /** Optional SKU / item code. */
  code: string | null;
  description: string | null;
  hsnCode: string | null;
  unit: string;
  /** Selling price per unit as a plain number string, e.g. "1250.5". */
  price: string;
  /** GST percent as a plain number string, e.g. "18". */
  taxRate: string;
  /** Path in the organization-files bucket. */
  imagePath: string | null;
  /** Short-lived signed link to the image, or null without one. */
  imageUrl: string | null;
  status: ProductStatus;
  createdAt: string;
}

/** What the order screen's item picker needs. */
export type ProductOption = Pick<
  Product,
  "id" | "name" | "code" | "hsnCode" | "unit" | "price" | "taxRate" | "imageUrl"
>;

export type SaveProductResult = { id: string; name: string } | { error: string; field?: "code" };
