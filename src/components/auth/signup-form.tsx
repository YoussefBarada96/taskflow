"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { Field } from "./field";

type SignupFormProps = { next: string; defaultEmail?: string };

export function SignupForm({ next, defaultEmail }: SignupFormProps) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Name"
        name="name"
        autoComplete="name"
        defaultValue={state?.values?.name}
        errors={state?.errors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email ?? defaultEmail}
        errors={state?.errors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={state?.errors?.password}
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
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
