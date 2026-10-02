"use client";

import { useActionState, useEffect, useRef } from "react";
import { deleteTask, updateTask } from "@/app/actions/tasks";
import { ConfirmButton } from "@/components/confirm-button";
import type { MemberDTO, TaskDTO } from "@/lib/board-types";
import { CommentSection } from "./comment-section";

const inputClass =
  "rounded-md border border-foreground/20 bg-transparent px-3 text-sm outline-none focus:border-foreground/60";

type TaskFormProps = {
  task: TaskDTO;
  members: MemberDTO[];
  onDone: () => void;
};

function TaskForm({ task, members, onDone }: TaskFormProps) {
  const [state, action, pending] = useActionState(updateTask.bind(null, task.id), undefined);

  useEffect(() => {
    if (state?.saved) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="task-title"
          name="title"
          required
          maxLength={200}
          defaultValue={task.title}
          className={`h-10 ${inputClass}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={4}
          maxLength={5000}
          defaultValue={task.description ?? ""}
          className={`py-2 ${inputClass}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-due" className="text-sm font-medium">
            Due date
          </label>
          <input
            id="task-due"
            name="dueDate"
            type="date"
            defaultValue={task.dueDate ?? ""}
            className={`h-10 ${inputClass}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-assignee" className="text-sm font-medium">
            Assignee
          </label>
          <select
            id="task-assignee"
            name="assigneeId"
            defaultValue={task.assigneeId ?? ""}
            className={`h-10 ${inputClass}`}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name ?? member.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-10 rounded-md border border-foreground/20 px-4 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

type TaskDialogProps = {
  task: TaskDTO | null;
  members: MemberDTO[];
  currentUserId: string;
  canModerate: boolean;
  onClose: () => void;
};

export function TaskDialog({ task, members, currentUserId, canModerate, onClose }: TaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (task && !dialog.open) dialog.showModal();
    else if (!task && dialog.open) dialog.close();
  }, [task]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-foreground/15 bg-background p-0 text-foreground backdrop:bg-black/50"
    >
      {task && (
        <div className="flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold tracking-tight">Edit task</h2>
          <TaskForm key={task.id} task={task} members={members} onDone={onClose} />
          <CommentSection
            key={`comments-${task.id}`}
            taskId={task.id}
            currentUserId={currentUserId}
            canModerate={canModerate}
          />
          <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
            <span className="text-sm text-foreground/60">Deleting cannot be undone.</span>
            <ConfirmButton
              action={deleteTask.bind(null, task.id)}
              message={`Delete the task "${task.title}"?`}
            >
              Delete task
            </ConfirmButton>
          </div>
        </div>
      )}
    </dialog>
  );
}
