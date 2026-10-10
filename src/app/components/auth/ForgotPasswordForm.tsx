"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/api/auth/actions";
import { Alert, Button, Field, Input } from "@/app/components/ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  if (state.message) {
    return (
      <Alert variant="success" title="Check your email">
        {state.message}
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Field label="Email" error={state.errors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          autoFocus
        />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
