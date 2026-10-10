"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/api/auth/actions";
import { Alert, Button, Field, Input } from "@/app/components/ui";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {notice && !state.error && <Alert variant="warning">{notice}</Alert>}
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
      <Field label="Password" error={state.errors?.password}>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="text-label text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
