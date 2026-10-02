"use server";

import { revalidatePath } from "next/cache";
import { boardPath, requireBoard, requireList } from "@/lib/authz";
import { NameSchema, type NameFormState } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

export async function createList(
  boardId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const { board } = await requireBoard(boardId);

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const last = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.list.create({
    data: { name: name.data, boardId, position: (last?.position ?? 0) + 1 },
  });

  revalidatePath(boardPath(board));
}

export async function renameList(
  listId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const { board } = await requireList(listId);

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  await prisma.list.update({ where: { id: listId }, data: { name: name.data } });

  revalidatePath(boardPath(board));
}

export async function deleteList(listId: string) {
  const { board } = await requireList(listId);

  await prisma.list.delete({ where: { id: listId } });

  revalidatePath(boardPath(board));
}
