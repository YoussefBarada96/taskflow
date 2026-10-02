"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canManage, requireMembership, requireUser } from "@/lib/authz";
import { NameSchema, type NameFormState } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

export async function createWorkspace(
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const user = await requireUser();

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const workspace = await prisma.workspace.create({
    data: {
      name: name.data,
      ownerId: user.id,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  redirect(`/w/${workspace.id}`);
}

export async function renameWorkspace(
  workspaceId: string,
  _state: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const { role } = await requireMembership(workspaceId);
  if (!canManage(role)) {
    return { error: "Only owners and admins can rename a workspace." };
  }

  const name = NameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: name.data },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/w/${workspaceId}`);
}

export async function deleteWorkspace(workspaceId: string) {
  const { role } = await requireMembership(workspaceId);
  if (role !== "OWNER") {
    throw new Error("Only the owner can delete a workspace.");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
