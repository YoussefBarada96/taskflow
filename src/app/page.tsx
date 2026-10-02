import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">TaskFlow</h1>
        <p className="max-w-md text-foreground/60">
          Plan work with your team on simple boards. Drag tasks from to-do to done.
        </p>
      </div>
      <div className="flex gap-3 text-sm font-medium">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="flex h-10 items-center rounded-md bg-foreground px-4 text-background"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="flex h-10 items-center rounded-md bg-foreground px-4 text-background"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="flex h-10 items-center rounded-md border border-foreground/20 px-4"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
