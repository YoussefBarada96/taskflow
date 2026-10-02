import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { firstParam, safeNextPath } from "@/lib/redirect";

export const metadata = { title: "Sign up | TaskFlow" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
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
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-foreground/60">Start organizing work with TaskFlow.</p>
      </div>
      <SignupForm next={next} defaultEmail={email} />
      <p className="text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href={`/login${query}`} className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
