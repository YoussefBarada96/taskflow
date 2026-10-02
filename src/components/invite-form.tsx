"use client";

import { useActionState } from "react";
import type { InviteFormState } from "@/lib/definitions";

type InviteFormProps = {
  action: (state: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  canInviteAdmin: boolean;
};

export function InviteForm({ action, canInviteAdmin }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <input
          name="email"
          type="email"
          required
          aria-label="Email address to invite"
          placeholder="teammate@example.com"
          className="h-10 min-w-0 flex-1 basis-56 rounded-md border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground/60"
        />
        <select
          name="role"
          aria-label="Role"
          defaultValue="MEMBER"
          className="h-10 rounded-md border border-foreground/20 bg-transparent px-2 text-sm outline-none focus:border-foreground/60"
        >
          <option value="MEMBER">Member</option>
          {canInviteAdmin && <option value="ADMIN">Admin</option>}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity disabled:opacity-60"
        >
          {pending ? "Inviting..." : "Invite"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-foreground/60">
          Invitation created. Copy its link below and send it to them.
        </p>
      )}
    </form>
  );
}
