"use client";

import { useActionState } from "react";
import type { NameFormState } from "@/lib/definitions";

type NameFormProps = {
  action: (state: NameFormState, formData: FormData) => Promise<NameFormState>;
  label: string;
  submitLabel: string;
  pendingLabel: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
};

export function NameForm({
  action,
  label,
  submitLabel,
  pendingLabel,
  defaultValue,
  placeholder,
  maxLength = 60,
}: NameFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          name="name"
          aria-label={label}
          required
          maxLength={maxLength}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 rounded-md border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
