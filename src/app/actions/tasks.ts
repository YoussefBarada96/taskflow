"use server";

import { revalidatePath } from "next/cache";
import { boardPath, requireList, requireTask } from "@/lib/authz";
import {
  TaskUpdateSchema,
  TitleSchema,
  type NameFormState,
  type TaskFormState,
} from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

// Positions are floats: a dropped task takes the midpoint of its neighbours, so one write moves it.
const between = (prev: number | undefined, next: number | undefined) => {
  if (prev === undefined && next === undefined) return 1;
  if (prev === undefined) return next! - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
};

async function rebalance(listId: string) {
  const tasks = await prisma.task.findMany({
    where: { listId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  await prisma.$transaction(
    tasks.map((task, index) =>
      prisma.task.update({ where: { id: task.id }, data: { position: index + 1 } }),
    ),
  );
}

// Returns null when a neighbour is no longer in the target list (the client's view is stale).
async function positionBetween(
  listId: string,
  prevId: string | null,
  nextId: string | null,
): Promise<number | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const [prev, next] = await Promise.all([
      prevId
        ? prisma.task.findFirst({ where: { id: prevId, listId }, select: { position: true } })
        : null,
      nextId
        ? prisma.task.findFirst({ where: { id: nextId, listId }, select: { position: true } })
        : null,
    ]);
    if ((prevId && !prev) || (nextId && !next)) return null;

    // Repeated midpoints eventually exhaust float precision, so renumber and retry once.
    if (prev && next && next.position - prev.position < 1e-6) {
      await rebalance(listId);
      continue;
    }
    return between(prev?.position, next?.position);
  }
  return null;
}

export async function createTask(
  listId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const { board } = await requireList(listId);

  const title = TitleSchema.safeParse(formData.get("name"));
  if (!title.success) return { error: title.error.issues[0].message };

  const last = await prisma.task.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.task.create({
    data: { title: title.data, listId, position: (last?.position ?? 0) + 1 },
  });

  revalidatePath(boardPath(board));
}

export async function updateTask(
  taskId: string,
  _state: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { board, workspace } = await requireTask(taskId);

  const parsed = TaskUpdateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    assigneeId: formData.get("assigneeId") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, description, dueDate, assigneeId } = parsed.data;

  if (assigneeId) {
    const member = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: assigneeId, workspaceId: workspace.id } },
    });
    if (!member) return { error: "The assignee must be a member of this workspace." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null,
      assigneeId: assigneeId || null,
    },
  });

  revalidatePath(boardPath(board));
  return { saved: true };
}

export async function deleteTask(taskId: string) {
  const { board } = await requireTask(taskId);

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath(boardPath(board));
}

// No revalidatePath here: the client already shows the new order, and re-rendering mid-drag would flicker.
export async function moveTask(
  taskId: string,
  toListId: string,
  prevId: string | null,
  nextId: string | null,
): Promise<{ error: string } | undefined> {
  const { board } = await requireTask(taskId);

  const toList = await prisma.list.findUnique({ where: { id: toListId } });
  if (!toList || toList.boardId !== board.id) {
    return { error: "That list no longer exists, so the board was refreshed." };
  }

  const position = await positionBetween(toListId, prevId, nextId);
  if (position === null) {
    return { error: "The board changed while you were dragging, so it was refreshed." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { listId: toListId, position },
  });
}
