import type { Database } from "@/types/database";
import type { Product, ProductOption } from "@/types/product";
import type { ProductInput } from "@/utils/validation/product";

type Tables = Database["public"]["Tables"];
type ProductRow = Tables["products"]["Row"];

/** Numeric column → the shortest number string ("1250.5", "18"). */
const plain = (value: number | string) => String(Number(value));

export function toProduct(row: ProductRow, imageUrl: string | null = null): Product {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    hsnCode: row.hsn_code,
    unit: row.unit,
    price: plain(row.price),
    taxRate: plain(row.tax_rate),
    imagePath: row.image_path,
    imageUrl,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toProductOption(product: Product): ProductOption {
  const { id, name, code, hsnCode, unit, price, taxRate, imageUrl } = product;
  return { id, name, code, hsnCode, unit, price, taxRate, imageUrl };
}

/** Validated form values → the columns the product form writes. */
export function toProductRow(p: ProductInput) {
  return {
    name: p.name,
    code: p.code,
    description: p.description,
    hsn_code: p.hsnCode,
    unit: p.unit,
    // At most 2 decimals (validated), so these convert exactly.
    price: Number(p.price),
    tax_rate: Number(p.taxRate),
  } satisfies Tables["products"]["Update"];
}
