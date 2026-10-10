"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/api/auth/authorize";
import { databaseErrorMessage } from "@/api/errors";
import { createClient } from "@/api/supabase/server";
import { UNIQUE_VIOLATION } from "@/constants/errors";
import { FORBIDDEN_MESSAGE } from "@/constants/messages";
import type { CustomerStatus, SaveCustomerResult } from "@/types/customer";
import type { ActionResult } from "@/types/form";
import { CustomerFormSchema, toCustomerInput } from "@/utils/validation/customer";

import { toCustomerRow } from "./mappers";

function revalidateCustomer(customerId: string) {
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

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
  const row = toCustomerRow(toCustomerInput(parsed.data));
  const organizationId = context.organization.id;

  const supabase = await createClient();
  const { data, error } = customerId
    ? await supabase
        .from("customers")
        .update(row)
        .eq("id", customerId)
        .eq("organization_id", organizationId)
        .select("id, name")
        .maybeSingle()
    : await supabase
        .from("customers")
        .insert({ ...row, organization_id: organizationId })
        .select("id, name")
        .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Another customer already uses this code", field: "code" };
    }
    return { error: databaseErrorMessage(error) };
  }
  if (!data) return { error: "This customer no longer exists." };

  revalidateCustomer(data.id);
  return data;
}

export async function setCustomerStatus(
  customerId: string,
  status: CustomerStatus,
): Promise<ActionResult> {
  const context = await authorize("customers.update");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ status })
    .eq("id", customerId)
    .eq("organization_id", context.organization.id);
  if (error) return { error: databaseErrorMessage(error) };

  revalidateCustomer(customerId);
  return {};
}
