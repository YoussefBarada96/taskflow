"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { deleteList, renameList } from "@/app/actions/lists";
import { createTask } from "@/app/actions/tasks";
import { ConfirmButton } from "@/components/confirm-button";
import { NameForm } from "@/components/name-form";
import type { ListDTO, MemberDTO } from "@/lib/board-types";
import { SortableTaskCard } from "./task-card";

type ListColumnProps = {
  list: ListDTO;
  members: MemberDTO[];
  onOpenTask: (taskId: string) => void;
};

export function ListColumn({ list, members, onOpenTask }: ListColumnProps) {
  // The task container is droppable too, so an empty list can still receive a task.
  const { setNodeRef, isOver } = useDroppable({ id: list.id });
  const taskCount = list.tasks.length;

  return (
    <section
      aria-label={list.name}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-foreground/[.05] p-3"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium">
          {list.name} <span className="font-normal text-foreground/50">{taskCount}</span>
        </h3>
        <details className="relative">
          <summary
            aria-label={`Options for ${list.name}`}
            className="flex size-7 cursor-pointer list-none items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/10"
          >
            ⋯
          </summary>
          <div className="absolute right-0 z-10 mt-1 flex w-64 flex-col gap-3 rounded-lg border border-foreground/15 bg-background p-3 shadow-lg">
            <NameForm
              action={renameList.bind(null, list.id)}
              label="List name"
              defaultValue={list.name}
              submitLabel="Rename"
              pendingLabel="Saving..."
            />
            <ConfirmButton
              action={deleteList.bind(null, list.id)}
              message={`Delete the list "${list.name}" and its ${taskCount} task${taskCount === 1 ? "" : "s"}? This cannot be undone.`}
            >
              Delete list
            </ConfirmButton>
          </div>
        </details>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-10 flex-col gap-2 rounded-md transition-colors ${isOver ? "bg-foreground/[.06]" : ""}`}
      >
        <SortableContext
          items={list.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              members={members}
              onOpen={() => onOpenTask(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      <NameForm
        action={createTask.bind(null, list.id)}
        label={`New task in ${list.name}`}
        placeholder="Add a task"
        maxLength={200}
        submitLabel="Add"
        pendingLabel="..."
      />
    </section>
  );
}
