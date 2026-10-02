import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

// Non-members get a 404 rather than a 403 so workspace ids can't be probed.
export async function requireMembership(workspaceId: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { workspace: true },
  });
  if (!membership) notFound();
  return { user, role: membership.role, workspace: membership.workspace };
}

export async function requireBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) notFound();
  const access = await requireMembership(board.workspaceId);
  return { ...access, board };
}

export async function requireList(listId: string) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: { board: true },
  });
  if (!list) notFound();
  const access = await requireMembership(list.board.workspaceId);
  return { ...access, list, board: list.board };
}

export async function requireTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) notFound();
  const access = await requireMembership(task.list.board.workspaceId);
  return { ...access, task, list: task.list, board: task.list.board };
}

export const boardPath = (board: { id: string; workspaceId: string }) =>
  `/w/${board.workspaceId}/b/${board.id}`;

export const canManage = (role: Role) => role === "OWNER" || role === "ADMIN";

// Owners can't be removed or leave; anyone else can leave; owners remove anyone, admins remove members.
export function canRemoveMember(
  actor: { userId: string; role: Role },
  target: { userId: string; role: Role },
) {
  if (target.role === "OWNER") return false;
  if (actor.userId === target.userId) return true;
  return actor.role === "OWNER" || (actor.role === "ADMIN" && target.role === "MEMBER");
}
