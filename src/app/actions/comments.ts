"use server";

import { revalidatePath } from "next/cache";
import { boardPath, canManage, requireMembership, requireTask } from "@/lib/authz";
import type { CommentDTO } from "@/lib/board-types";
import { commentInclude, toCommentDTO } from "@/lib/comments";
import { CommentSchema } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

export async function addComment(
  taskId: string,
  formData: FormData,
): Promise<{ error: string } | { comment: CommentDTO }> {
  const { user, board } = await requireTask(taskId);

  const body = CommentSchema.safeParse(formData.get("body"));
  if (!body.success) return { error: body.error.issues[0].message };

  const comment = await prisma.comment.create({
    data: { body: body.data, taskId, authorId: user.id },
    include: commentInclude,
  });

  revalidatePath(boardPath(board));
  return { comment: toCommentDTO(comment) };
}

export async function deleteComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });
  if (!comment) return;

  const board = comment.task.list.board;
  const { user, role } = await requireMembership(board.workspaceId);
  if (comment.authorId !== user.id && !canManage(role)) {
    throw new Error("You can only delete your own comments.");
  }

  await prisma.comment.deleteMany({ where: { id: commentId } });
  revalidatePath(boardPath(board));
}
