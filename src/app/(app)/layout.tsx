import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/authz";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            TaskFlow
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-foreground/60 sm:inline">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="h-8 rounded-md border border-foreground/20 px-3 font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}
