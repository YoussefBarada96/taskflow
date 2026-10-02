import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";
import { acceptInvitation } from "@/app/actions/invitations";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Invitation | TaskFlow" };

const buttonClass =
  "flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background";
const outlineClass =
  "flex h-10 items-center justify-center rounded-md border border-foreground/20 px-4 text-sm font-medium";

function Message({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { name: true } } },
  });

  if (!invitation || invitation.expiresAt <= new Date()) {
    return (
      <Message title="Invitation not valid">
        <p className="text-sm text-foreground/60">
          This invitation link is invalid, has expired, or was revoked. Ask the workspace
          admin to send you a new one.
        </p>
        <Link href="/dashboard" className={outlineClass}>
          Go to dashboard
        </Link>
      </Message>
    );
  }

  const session = await auth();
  const carry = new URLSearchParams({
    next: `/invite/${token}`,
    email: invitation.email,
  }).toString();

  if (!session?.user) {
    return (
      <Message title={`Join ${invitation.workspace.name}`}>
        <p className="text-sm text-foreground/60">
          You&apos;ve been invited to join this workspace on TaskFlow. Sign in or create an
          account with <span className="font-medium text-foreground">{invitation.email}</span>{" "}
          to accept.
        </p>
        <Link href={`/signup?${carry}`} className={buttonClass}>
          Create account
        </Link>
        <Link href={`/login?${carry}`} className={outlineClass}>
          Sign in
        </Link>
      </Message>
    );
  }

  if (session.user.email?.toLowerCase() !== invitation.email) {
    return (
      <Message title="Wrong account">
        <p className="text-sm text-foreground/60">
          This invitation was sent to{" "}
          <span className="font-medium text-foreground">{invitation.email}</span>, but you&apos;re
          signed in as {session.user.email}. Sign out and use the invited address.
        </p>
        <form action={logout}>
          <button type="submit" className={`${outlineClass} w-full`}>
            Sign out
          </button>
        </form>
      </Message>
    );
  }

  return (
    <Message title={`Join ${invitation.workspace.name}`}>
      <p className="text-sm text-foreground/60">
        You&apos;ve been invited to join as{" "}
        <span className="font-medium text-foreground">{invitation.role.toLowerCase()}</span>.
      </p>
      <form action={acceptInvitation.bind(null, token)}>
        <button type="submit" className={`${buttonClass} w-full`}>
          Accept invitation
        </button>
      </form>
    </Message>
  );
}
