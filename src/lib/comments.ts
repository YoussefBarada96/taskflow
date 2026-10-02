import type { CommentDTO } from "@/lib/board-types";

export const commentInclude = {
  author: { select: { id: true, name: true, email: true } },
} as const;

export function toCommentDTO(comment: {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string | null; email: string };
}): CommentDTO {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
  };
}
