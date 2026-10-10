import "server-only";

import { signedUrls } from "@/api/storage";
import { createClient } from "@/api/supabase/server";
import { PRODUCT_PAGE_SIZE } from "@/constants/pagination";
import { PRODUCT_OPTIONS_LIMIT } from "@/constants/products";
import type { Database } from "@/types/database";
import type { Product, ProductOption, ProductStatus, ProductStatusFilter } from "@/types/product";
import { containsPattern } from "@/utils/ids";

import { toProduct, toProductOption } from "./mappers";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/** Rows → products with signed image links (one storage request for all of them). */
async function withImages(rows: ProductRow[]): Promise<Product[]> {
  const urls = await signedUrls(rows.map((r) => r.image_path));
  return rows.map((row) =>
    toProduct(row, row.image_path ? (urls.get(row.image_path) ?? null) : null),
  );
}

export async function listProducts({
  organizationId,
  q,
  status = "ACTIVE",
  page = 1,
}: {
  organizationId: string;
  q?: string;
  status?: ProductStatusFilter;
  page?: number;
}): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PRODUCT_PAGE_SIZE;
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("name")
    .order("id")
    .range(from, from + PRODUCT_PAGE_SIZE - 1);
  if (status !== "ALL") query = query.eq("status", status);
  if (q) {
    const p = containsPattern(q);
    query = query.or(`name.ilike.${p},code.ilike.${p},hsn_code.ilike.${p},description.ilike.${p}`);
  }
  const { data, count, error } = await query;
  if (error) throw error;
  return { products: await withImages(data), total: count ?? 0 };
}

export async function countProducts(organizationId: string, status?: ProductStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getProduct(organizationId: string, id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = await withImages([data]);
  return product;
}

/** Active products for the order screen's item picker, by name. */
export async function listProductOptions(organizationId: string): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE")
    .order("name")
    .limit(PRODUCT_OPTIONS_LIMIT);
  if (error) throw error;
  return (await withImages(data)).map(toProductOption);
}
