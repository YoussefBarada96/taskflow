"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canRemoveMember, requireMembership } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function removeMember(workspaceId: string, userId: string) {
  const { user, role } = await requireMembership(workspaceId);

  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target) return;

  if (!canRemoveMember({ userId: user.id, role }, target)) {
    throw new Error("You can't remove this member.");
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { assigneeId: userId, list: { board: { workspaceId } } },
      data: { assigneeId: null },
    }),
    prisma.membership.delete({ where: { userId_workspaceId: { userId, workspaceId } } }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath(`/w/${workspaceId}`);
  if (userId === user.id) redirect("/dashboard");
}
