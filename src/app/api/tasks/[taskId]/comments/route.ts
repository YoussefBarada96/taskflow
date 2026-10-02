import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { commentInclude, toCommentDTO } from "@/lib/comments";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/tasks/[taskId]/comments">,
) {
  const { taskId } = await ctx.params;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A single query proves both that the task exists and that the caller belongs to its workspace.
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: { workspace: { memberships: { some: { userId: session.user.id } } } },
      },
    },
    select: { id: true },
  });
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: commentInclude,
  });

  return Response.json({ comments: comments.map(toCommentDTO) });
}
