"use server";

import { randomBytes } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { canManage, requireMembership, requireUser } from "@/lib/authz";
import { InviteSchema, type InviteFormState } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";

const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvitation(
  workspaceId: string,
  _state: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { role: actorRole } = await requireMembership(workspaceId);
  if (!canManage(actorRole)) {
    return { error: "Only owners and admins can invite people." };
  }

  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role } = parsed.data;

  if (role === "ADMIN" && actorRole !== "OWNER") {
    return { error: "Only the owner can invite admins." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
    });
    if (membership) return { error: "That person is already a member of this workspace." };
  }

  const now = new Date();
  await prisma.invitation.deleteMany({
    where: { workspaceId, email, expiresAt: { lte: now } },
  });
  const pending = await prisma.invitation.findFirst({ where: { workspaceId, email } });
  if (pending) {
    return { error: "That email already has a pending invitation. Copy its link below." };
  }

  await prisma.invitation.create({
    data: {
      email,
      role,
      workspaceId,
      // 256 random bits: the link itself is the credential, so it must be unguessable.
      token: randomBytes(32).toString("base64url"),
      expiresAt: new Date(now.getTime() + INVITE_LIFETIME_MS),
    },
  });

  revalidatePath(`/w/${workspaceId}`);
  return { ok: true };
}

export async function revokeInvitation(invitationId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return;

  const { role } = await requireMembership(invitation.workspaceId);
  if (!canManage(role)) throw new Error("Only owners and admins can revoke invitations.");

  await prisma.invitation.deleteMany({ where: { id: invitationId } });
  revalidatePath(`/w/${invitation.workspaceId}`);
}

export async function acceptInvitation(token: string) {
  const user = await requireUser();

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (
    !invitation ||
    invitation.expiresAt <= new Date() ||
    invitation.email !== user.email?.toLowerCase()
  ) {
    notFound();
  }

  try {
    await prisma.$transaction([
      prisma.membership.create({
        data: { userId: user.id, workspaceId: invitation.workspaceId, role: invitation.role },
      }),
      prisma.invitation.delete({ where: { id: invitation.id } }),
    ]);
  } catch (error) {
    // Already a member (e.g. the link was opened twice): just consume the invitation.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await prisma.invitation.deleteMany({ where: { id: invitation.id } });
    } else {
      throw error;
    }
  }

  revalidatePath("/dashboard");
  redirect(`/w/${invitation.workspaceId}`);
}
