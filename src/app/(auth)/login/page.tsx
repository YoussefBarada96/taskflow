import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { firstParam, safeNextPath } from "@/lib/redirect";

export const metadata = { title: "Sign in | TaskFlow" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));
  const email = firstParam(params.email);

  const carry = new URLSearchParams();
  if (next !== "/dashboard") carry.set("next", next);
  if (email) carry.set("email", email);
  const query = carry.size ? `?${carry}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-foreground/60">Sign in to your TaskFlow account.</p>
      </div>
      <LoginForm next={next} defaultEmail={email} />
      <p className="text-sm text-foreground/60">
        No account yet?{" "}
        <Link href={`/signup${query}`} className="font-medium text-foreground underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
