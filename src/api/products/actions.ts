"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/api/auth/authorize";
import { databaseErrorMessage } from "@/api/errors";
import { removeFiles, uploadFile } from "@/api/storage";
import { createClient } from "@/api/supabase/server";
import { UNIQUE_VIOLATION } from "@/constants/errors";
import { FORBIDDEN_MESSAGE } from "@/constants/messages";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from "@/constants/products";
import type { ActionResult } from "@/types/form";
import type { ProductStatus, SaveProductResult } from "@/types/product";
import { formValues } from "@/utils/forms";
import { PRODUCT_FORM_FIELDS, ProductFormSchema } from "@/utils/validation/product";

import { toProductRow } from "./mappers";

const EXTENSIONS: Record<(typeof PRODUCT_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function revalidateProducts() {
  revalidatePath("/products");
  // The order screens list products in their item picker.
  revalidatePath("/orders", "layout");
}

/** The uploaded image, null for none, or an error message. */
function readImage(formData: FormData): File | null | { error: string } {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Use a JPG, PNG or WebP image" };
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return { error: "The image is too large" };
  return file;
}

/**
 * Creates (productId = null) or updates a product from the product form.
 * Fields are validated again here; `image` replaces the picture and
 * `removeImage=1` clears it.
 */
export async function saveProduct(
  productId: string | null,
  formData: FormData,
): Promise<SaveProductResult> {
  const context = await authorize(productId ? "products.update" : "products.create");
  if (!context) return { error: FORBIDDEN_MESSAGE };
  const organizationId = context.organization.id;

  const parsed = ProductFormSchema.safeParse(formValues(formData, PRODUCT_FORM_FIELDS));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid product" };
  const image = readImage(formData);
  if (image && "error" in image) return image;

  const supabase = await createClient();
  const id = productId ?? crypto.randomUUID();
  let previousImage: string | null = null;
  if (productId) {
    const { data: existing, error } = await supabase
      .from("products")
      .select("image_path")
      .eq("organization_id", organizationId)
      .eq("id", productId)
      .maybeSingle();
    if (error) return { error: databaseErrorMessage(error) };
    if (!existing) return { error: "This product no longer exists." };
    previousImage = existing.image_path;
  }

  // Upload first, so a failed upload never leaves a half-saved product.
  let imagePath = previousImage;
  if (image) {
    imagePath = `organizations/${organizationId}/products/${id}/${crypto.randomUUID()}.${EXTENSIONS[image.type as keyof typeof EXTENSIONS]}`;
    const upload = await uploadFile(imagePath, image);
    if (upload.error) return { error: upload.error };
  } else if (formData.get("removeImage") === "1") {
    imagePath = null;
  }

  const row = { ...toProductRow(parsed.data), image_path: imagePath };
  const { data, error } = productId
    ? await supabase
        .from("products")
        .update(row)
        .eq("id", productId)
        .eq("organization_id", organizationId)
        .select("id, name")
        .maybeSingle()
    : await supabase
        .from("products")
        .insert({ ...row, id, organization_id: organizationId })
        .select("id, name")
        .single();

  if (error || !data) {
    if (image && imagePath) await removeFiles([imagePath]);
    if (error?.code === UNIQUE_VIOLATION) {
      return { error: "Another product already uses this code", field: "code" };
    }
    return { error: error ? databaseErrorMessage(error) : "This product no longer exists." };
  }

  if (previousImage && previousImage !== imagePath) await removeFiles([previousImage]);
  revalidateProducts();
  return data;
}

export async function setProductStatus(
  productId: string,
  status: ProductStatus,
): Promise<ActionResult> {
  const context = await authorize("products.update");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId)
    .eq("organization_id", context.organization.id);
  if (error) return { error: databaseErrorMessage(error) };

  revalidateProducts();
  return {};
}
