import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBoard, renameBoard } from "@/app/actions/boards";
import { BoardView } from "@/components/board/board-view";
import { ConfirmButton } from "@/components/confirm-button";
import { NameForm } from "@/components/name-form";
import { canManage, requireMembership } from "@/lib/authz";
import type { ListDTO, MemberDTO } from "@/lib/board-types";
import { prisma } from "@/lib/prisma";

export default async function BoardPage({
  params,
}: PageProps<"/w/[workspaceId]/b/[boardId]">) {
  const { workspaceId, boardId } = await params;
  const { user, workspace, role } = await requireMembership(workspaceId);

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
  });
  if (!board) notFound();

  const [lists, memberships] = await Promise.all([
    prisma.list.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
      include: {
        tasks: {
          orderBy: { position: "asc" },
          include: { _count: { select: { comments: true } } },
        },
      },
    }),
    prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const listDTOs: ListDTO[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    tasks: list.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
      assigneeId: task.assigneeId,
      commentCount: task._count.comments,
    })),
  }));
  const memberDTOs: MemberDTO[] = memberships.map(({ user }) => user);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <nav className="text-sm text-foreground/60">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link href={`/w/${workspaceId}`} className="hover:text-foreground">
            {workspace.name}
          </Link>{" "}
          / {board.name}
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">{board.name}</h1>
      </div>

      <BoardView
        boardId={boardId}
        lists={listDTOs}
        members={memberDTOs}
        currentUserId={user.id}
        canModerate={canManage(role)}
      />

      {canManage(role) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Board settings</h2>
          <div className="max-w-md">
            <NameForm
              action={renameBoard.bind(null, boardId)}
              label="Board name"
              defaultValue={board.name}
              submitLabel="Rename"
              pendingLabel="Saving..."
            />
          </div>
          <div className="pt-2">
            <ConfirmButton
              action={deleteBoard.bind(null, boardId)}
              message={`Delete the board "${board.name}"? This cannot be undone.`}
            >
              Delete board
            </ConfirmButton>
          </div>
        </section>
      )}
    </div>
  );
}
