"use client";

import { useActionState } from "react";

import { Alert, Button, Field, Input } from "@/components/ui";

import { updatePassword } from "../actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Field
        label="New password"
        description="At least 8 characters, with letters and numbers"
        error={state.errors?.password}
      >
        <Input name="password" type="password" autoComplete="new-password" autoFocus />
      </Field>
      <Field label="Confirm new password" error={state.errors?.confirmPassword}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
