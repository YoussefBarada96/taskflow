import Link from "next/link";
import { createWorkspace } from "@/app/actions/workspaces";
import { NameForm } from "@/components/name-form";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard | TaskFlow" };

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: { _count: { select: { boards: true, memberships: true } } },
      },
    },
    orderBy: { workspace: { createdAt: "desc" } },
  });

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name ?? user.email}
        </h1>
        <p className="text-foreground/60">
          Workspaces group the boards you share with a team.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Create a workspace</h2>
        <div className="max-w-md">
          <NameForm
            action={createWorkspace}
            label="Workspace name"
            placeholder="e.g. Marketing team"
            submitLabel="Create"
            pendingLabel="Creating..."
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Your workspaces</h2>
        {memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-foreground/20 p-8 text-center text-sm text-foreground/60">
            You are not in any workspace yet. Create one above to get started.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ workspace, role }) => (
              <li key={workspace.id}>
                <Link
                  href={`/w/${workspace.id}`}
                  className="flex h-full flex-col gap-2 rounded-lg border border-foreground/15 p-4 transition-colors hover:border-foreground/40"
                >
                  <span className="font-medium">{workspace.name}</span>
                  <span className="text-sm text-foreground/60">
                    {plural(workspace._count.boards, "board")} ·{" "}
                    {plural(workspace._count.memberships, "member")}
                  </span>
                  <span className="mt-auto text-xs uppercase tracking-wide text-foreground/50">
                    {role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
