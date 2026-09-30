"use client";

import { useActionState } from "react";

import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { GST_STATES } from "@/constants/gst-states";

import { createOrganization } from "../actions";

const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

export function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <Field label="Business name" required error={state.errors?.name}>
        <Input
          name="name"
          placeholder="ABC Distributors"
          defaultValue={state.values?.name}
          autoFocus
        />
      </Field>
      <Field
        label="Legal name"
        description="As registered, if different from the business name"
        error={state.errors?.legalName}
      >
        <Input name="legalName" defaultValue={state.values?.legalName} />
      </Field>
      <Field
        label="GSTIN"
        description="Optional — you can add it later in settings"
        error={state.errors?.gstin}
      >
        <Input
          name="gstin"
          placeholder="03AAACA1234A1Z5"
          maxLength={15}
          autoCapitalize="characters"
          className="font-mono uppercase"
          defaultValue={state.values?.gstin}
        />
      </Field>
      <Field
        label="State"
        description="Decides whether orders are charged CGST + SGST or IGST"
        error={state.errors?.stateCode}
      >
        <Select
          // Remount after a failed submit so the chosen state survives React's form reset.
          key={state.values?.stateCode}
          name="stateCode"
          options={STATE_OPTIONS}
          placeholder="Select your state"
          defaultValue={state.values?.stateCode || undefined}
        />
      </Field>

      <Button type="submit" size="lg" loading={pending}>
        Create business
      </Button>
    </form>
  );
}
