"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Field } from "./field";

type LoginFormProps = { next: string; defaultEmail?: string };

export function LoginForm({ next, defaultEmail }: LoginFormProps) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email ?? defaultEmail}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      {state?.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-foreground text-sm font-medium text-background transition-opacity disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
