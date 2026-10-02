import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-foreground/60">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
