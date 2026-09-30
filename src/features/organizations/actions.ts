"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fromDatabaseError } from "@/lib/api/db-errors";
import { ACTIVE_ORGANIZATION_COOKIE, getMemberships, requireUser } from "@/lib/auth/session";
import { HOME_PATH } from "@/lib/auth/routes";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { CreateOrganizationSchema } from "@/lib/validation/organization";

export type CreateOrganizationField = "name" | "legalName" | "gstin" | "stateCode";

const FIELDS = ["name", "legalName", "gstin", "stateCode"] as const;

export async function createOrganization(
  _: FormState<CreateOrganizationField>,
  formData: FormData,
): Promise<FormState<CreateOrganizationField>> {
  await requireUser();
  if ((await getMemberships()).length > 0) redirect(HOME_PATH);

  const values = formValues(formData, FIELDS);
  const parsed = CreateOrganizationSchema.safeParse({
    name: values.name,
    legalName: values.legalName,
    gstin: values.gstin.trim() || null,
    stateCode: values.stateCode || null,
  });
  if (!parsed.success) {
    return { errors: fieldErrors<CreateOrganizationField>(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_legal_name: parsed.data.legalName ?? undefined,
    p_gstin: parsed.data.gstin ?? undefined,
    p_state_code: parsed.data.stateCode ?? undefined,
  });
  if (error) return { error: fromDatabaseError(error).message, values };

  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(HOME_PATH);
}
