"use client";

import { useEffect } from "react";

type ErrorViewProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export function ErrorView({ error, retry }: ErrorViewProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-foreground/60">
        We couldn&apos;t load this page. This is usually a brief connection problem, so trying
        again often fixes it.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        Try again
      </button>
      {error.digest && (
        <p className="text-xs text-foreground/40">Reference: {error.digest}</p>
      )}
    </div>
  );
}
