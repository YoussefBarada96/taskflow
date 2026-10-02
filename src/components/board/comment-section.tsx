"use client";

import { useEffect, useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions/comments";
import type { CommentDTO } from "@/lib/board-types";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

type CommentItemProps = {
  comment: CommentDTO;
  canDelete: boolean;
  onDeleted: (id: string) => void;
};

function CommentItem({ comment, canDelete, onDeleted }: CommentItemProps) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      onDeleted(comment.id);
    });
  }

  return (
    <li className={`flex flex-col gap-1 text-sm ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span>
          <span className="font-medium">{comment.author.name ?? comment.author.email}</span>
          <span className="ml-2 text-xs text-foreground/50">{formatTime(comment.createdAt)}</span>
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-xs text-foreground/60 underline hover:text-red-600 dark:hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>
      <p className="break-words whitespace-pre-wrap">{comment.body}</p>
    </li>
  );
}

type CommentSectionProps = {
  taskId: string;
  currentUserId: string;
  canModerate: boolean;
};

// Mount with key={taskId}: state is per task, so switching tasks starts fresh.
export function CommentSection({ taskId, currentUserId, canModerate }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tasks/${taskId}/comments`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load comments");
        return response.json() as Promise<{ comments: CommentDTO[] }>;
      })
      .then((data) => {
        if (!cancelled) setComments(data.comments);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      try {
        const result = await addComment(taskId, formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setComments((current) => [...(current ?? []), result.comment]);
        form.reset();
      } catch {
        setError("Couldn't post your comment. Try again.");
      }
    });
  }

  return (
    <section aria-label="Comments" className="flex flex-col gap-3 border-t border-foreground/10 pt-4">
      <h3 className="text-sm font-medium">
        Comments{comments ? ` (${comments.length})` : ""}
      </h3>

      {loadFailed ? (
        <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load comments.</p>
      ) : comments === null ? (
        <p className="text-sm text-foreground/60">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-foreground/60">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={canModerate || comment.author.id === currentUserId}
              onDeleted={(id) => setComments((current) => current?.filter((c) => c.id !== id) ?? null)}
            />
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <textarea
          name="body"
          aria-label="Add a comment"
          placeholder="Write a comment"
          rows={2}
          required
          maxLength={2000}
          disabled={comments === null}
          className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/60 disabled:opacity-60"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || comments === null}
          className="h-9 self-end rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Posting..." : "Comment"}
        </button>
      </form>
    </section>
  );
}
