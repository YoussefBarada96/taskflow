"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="h-9 rounded-md border border-foreground/20 px-3 text-sm font-medium"
    >
      {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy link"}
    </button>
  );
}
