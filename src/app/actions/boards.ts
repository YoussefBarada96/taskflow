"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canManage, requireBoard, requireMembership } from "@/lib/authz";
import { NameSchema, type NameFormState } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

export async function createBoard(
  workspaceId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  await requireMembership(workspaceId);

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  await prisma.board.create({ data: { name: name.data, workspaceId } });

  revalidatePath("/dashboard");
  revalidatePath(`/w/${workspaceId}`);
}

export async function renameBoard(
  boardId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const { board, role } = await requireBoard(boardId);
  if (!canManage(role)) {
    return { error: "Only owners and admins can rename a board." };
  }

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  await prisma.board.update({ where: { id: boardId }, data: { name: name.data } });

  revalidatePath(`/w/${board.workspaceId}`);
  revalidatePath(`/w/${board.workspaceId}/b/${boardId}`);
}

export async function deleteBoard(boardId: string) {
  const { board, role } = await requireBoard(boardId);
  if (!canManage(role)) {
    throw new Error("Only owners and admins can delete a board.");
  }

  await prisma.board.delete({ where: { id: boardId } });

  revalidatePath("/dashboard");
  revalidatePath(`/w/${board.workspaceId}`);
  redirect(`/w/${board.workspaceId}`);
}
