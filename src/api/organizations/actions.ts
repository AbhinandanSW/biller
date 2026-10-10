"use server";

import { redirect } from "next/navigation";

import { getMemberships, requireUser, setActiveOrganization } from "@/api/auth/session";
import { databaseErrorMessage } from "@/api/errors";
import { createClient } from "@/api/supabase/server";
import { HOME_PATH } from "@/constants/routes";
import type { CreateOrganizationField, FormState } from "@/types/form";
import { fieldErrors, formValues } from "@/utils/forms";
import { CreateOrganizationSchema } from "@/utils/validation/organization";

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
  if (error) return { error: databaseErrorMessage(error), values };

  await setActiveOrganization(data.id);
  redirect(HOME_PATH);
}
