"use client";

type ConfirmButtonProps = {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
};

export function ConfirmButton({ action, message, children }: ConfirmButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      <button
        type="submit"
        className="h-9 rounded-md border border-red-500/40 px-3 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
      >
        {children}
      </button>
    </form>
  );
}
