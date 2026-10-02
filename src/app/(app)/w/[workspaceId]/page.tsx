import Link from "next/link";
import { createBoard } from "@/app/actions/boards";
import { createInvitation, revokeInvitation } from "@/app/actions/invitations";
import { removeMember } from "@/app/actions/members";
import { deleteWorkspace, renameWorkspace } from "@/app/actions/workspaces";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { InviteForm } from "@/components/invite-form";
import { NameForm } from "@/components/name-form";
import { canManage, canRemoveMember, requireMembership } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function WorkspacePage({
  params,
}: PageProps<"/w/[workspaceId]">) {
  const { workspaceId } = await params;
  const { user, workspace, role } = await requireMembership(workspaceId);

  const [boards, members, invitations] = await Promise.all([
    prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    canManage(role)
      ? prisma.invitation.findMany({
          where: { workspaceId, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-2">
        <nav className="text-sm text-foreground/60">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>{" "}
          / {workspace.name}
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Boards</h2>
        <div className="max-w-md">
          <NameForm
            action={createBoard.bind(null, workspaceId)}
            label="Board name"
            placeholder="New board name"
            submitLabel="Add board"
            pendingLabel="Adding..."
          />
        </div>
        {boards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-foreground/20 p-8 text-center text-sm text-foreground/60">
            No boards yet. Add your first board above.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  href={`/w/${workspaceId}/b/${board.id}`}
                  className="flex h-20 items-start rounded-lg border border-foreground/15 p-4 font-medium transition-colors hover:border-foreground/40"
                >
                  {board.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Members</h2>
        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/15">
          {members.map((member) => {
            const isSelf = member.userId === user.id;
            return (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="min-w-0 break-words">
                  <span className="font-medium">{member.user.name ?? member.user.email}</span>
                  {isSelf && <span className="ml-2 text-foreground/50">(you)</span>}
                  {member.user.name && (
                    <span className="ml-2 text-foreground/60">{member.user.email}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-foreground/50">
                    {member.role}
                  </span>
                  {canRemoveMember({ userId: user.id, role }, member) && (
                    <ConfirmButton
                      action={removeMember.bind(null, workspaceId, member.userId)}
                      message={
                        isSelf
                          ? `Leave "${workspace.name}"? You'll lose access to its boards.`
                          : `Remove ${member.user.name ?? member.user.email} from "${workspace.name}"?`
                      }
                    >
                      {isSelf ? "Leave" : "Remove"}
                    </ConfirmButton>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {canManage(role) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Invite people</h2>
          <div className="max-w-xl">
            <InviteForm
              action={createInvitation.bind(null, workspaceId)}
              canInviteAdmin={role === "OWNER"}
            />
          </div>
          {invitations.length > 0 && (
            <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/15">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 break-words">
                    <span className="font-medium">{invitation.email}</span>
                    <span className="ml-2 text-xs uppercase tracking-wide text-foreground/50">
                      {invitation.role}
                    </span>
                    <span className="ml-2 text-foreground/60">
                      expires{" "}
                      {invitation.expiresAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CopyLinkButton path={`/invite/${invitation.token}`} />
                    <ConfirmButton
                      action={revokeInvitation.bind(null, invitation.id)}
                      message={`Revoke the invitation for ${invitation.email}?`}
                    >
                      Revoke
                    </ConfirmButton>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canManage(role) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Workspace settings</h2>
          <div className="max-w-md">
            <NameForm
              action={renameWorkspace.bind(null, workspaceId)}
              label="Workspace name"
              defaultValue={workspace.name}
              submitLabel="Rename"
              pendingLabel="Saving..."
            />
          </div>
          {role === "OWNER" && (
            <div className="flex flex-col items-start gap-2 pt-2">
              <p className="text-sm text-foreground/60">
                Deleting a workspace permanently removes all of its boards.
              </p>
              <ConfirmButton
                action={deleteWorkspace.bind(null, workspaceId)}
                message={`Delete "${workspace.name}" and everything in it? This cannot be undone.`}
              >
                Delete workspace
              </ConfirmButton>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
