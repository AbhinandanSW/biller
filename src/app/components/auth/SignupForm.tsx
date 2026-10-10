"use client";

import { useActionState } from "react";

import { signup } from "@/api/auth/actions";
import { Alert, Button, Field, Input } from "@/app/components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});

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

      <Field label="Your name" error={state.errors?.fullName}>
        <Input
          name="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName}
          autoFocus
        />
      </Field>
      <Field label="Work email" error={state.errors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state.values?.email} />
      </Field>
      <Field
        label="Password"
        description="At least 8 characters, with letters and numbers"
        error={state.errors?.password}
      >
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>

      <Button type="submit" size="lg" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
