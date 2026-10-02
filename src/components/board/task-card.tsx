"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MemberDTO, TaskDTO } from "@/lib/board-types";

// Fixed locale and UTC keep server and client output identical.
const formatDue = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const initials = (member: MemberDTO) =>
  (member.name ?? member.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

type TaskCardBodyProps = {
  task: TaskDTO;
  members: MemberDTO[];
  onOpen?: () => void;
};

export function TaskCardBody({ task, members, onOpen }: TaskCardBodyProps) {
  const assignee = members.find((member) => member.id === task.assigneeId);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-foreground/15 bg-background p-3 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left text-sm font-medium break-words"
      >
        {task.title}
      </button>
      {(task.dueDate || assignee || task.commentCount > 0) && (
        <div className="flex items-center justify-between gap-2 text-xs text-foreground/60">
          <span className="flex items-center gap-3">
            {task.dueDate && <span>Due {formatDue(task.dueDate)}</span>}
            {task.commentCount > 0 && (
              <span
                title={`${task.commentCount} comment${task.commentCount === 1 ? "" : "s"}`}
                className="flex items-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
                </svg>
                {task.commentCount}
              </span>
            )}
          </span>
          {assignee && (
            <span
              title={assignee.name ?? assignee.email}
              className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground"
            >
              {initials(assignee)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SortableTaskCard(props: TaskCardBodyProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      // The card contains a real button, so it must not also announce itself as one.
      role="group"
      {...listeners}
      className={`touch-manipulation ${isDragging ? "opacity-40" : ""}`}
    >
      <TaskCardBody {...props} />
    </div>
  );
}
