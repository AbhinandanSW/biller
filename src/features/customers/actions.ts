"use server";

import { revalidatePath } from "next/cache";

import { fromDatabaseError } from "@/lib/api/db-errors";
import { authorize, FORBIDDEN_MESSAGE } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";

import { CustomerFormSchema, toCustomerInput } from "./schema";

export type SaveCustomerResult =
  { id: string; name: string } | { error: string; field?: "code" | "gstin" };

/**
 * Creates (customerId = null) or updates a customer. `values` is the raw form
 * data — it's validated again here; the browser's validation is only for UX.
 */
export async function saveCustomer(
  customerId: string | null,
  values: Record<string, unknown>,
): Promise<SaveCustomerResult> {
  const context = await authorize(customerId ? "customers.update" : "customers.create");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const parsed = CustomerFormSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid customer" };
  const c = toCustomerInput(parsed.data);

  const row = {
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
  };

  const supabase = await createClient();
  const { data, error } = customerId
    ? await supabase
        .from("customers")
        .update(row)
        .eq("id", customerId)
        .eq("organization_id", context.organization.id)
        .select("id, name")
        .maybeSingle()
    : await supabase
        .from("customers")
        .insert({ ...row, organization_id: context.organization.id })
        .select("id, name")
        .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Another customer already uses this code", field: "code" };
    }
    return { error: fromDatabaseError(error).message };
  }
  if (!data) return { error: "This customer no longer exists." };

  revalidatePath("/customers");
  revalidatePath(`/customers/${data.id}`);
  return data;
}

export async function setCustomerStatus(
  customerId: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<{ error?: string }> {
  const context = await authorize("customers.update");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ status })
    .eq("id", customerId)
    .eq("organization_id", context.organization.id);
  if (error) return { error: fromDatabaseError(error).message };

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return {};
}
