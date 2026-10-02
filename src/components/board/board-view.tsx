"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createList } from "@/app/actions/lists";
import { moveTask } from "@/app/actions/tasks";
import { NameForm } from "@/components/name-form";
import type { ListDTO, MemberDTO } from "@/lib/board-types";
import { ListColumn } from "./list-column";
import { TaskCardBody } from "./task-card";
import { TaskDialog } from "./task-dialog";

// A drag id is either a list id (empty area of a column) or a task id.
function listIdOf(lists: ListDTO[], id: UniqueIdentifier) {
  return (
    lists.find((list) => list.id === id)?.id ??
    lists.find((list) => list.tasks.some((task) => task.id === id))?.id
  );
}

function moveAcrossLists(
  lists: ListDTO[],
  taskId: string,
  overId: UniqueIdentifier,
  isBelowOver: boolean,
): ListDTO[] {
  const fromId = listIdOf(lists, taskId);
  const toId = listIdOf(lists, overId);
  if (!fromId || !toId || fromId === toId) return lists;

  const task = lists.find((list) => list.id === fromId)!.tasks.find((t) => t.id === taskId)!;

  return lists.map((list) => {
    if (list.id === fromId) {
      return { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) };
    }
    if (list.id === toId) {
      const overIndex = list.tasks.findIndex((t) => t.id === overId);
      const index = overIndex === -1 ? list.tasks.length : overIndex + (isBelowOver ? 1 : 0);
      return { ...list, tasks: [...list.tasks.slice(0, index), task, ...list.tasks.slice(index)] };
    }
    return list;
  });
}

type BoardViewProps = {
  boardId: string;
  lists: ListDTO[];
  members: MemberDTO[];
  currentUserId: string;
  canModerate: boolean;
};

export function BoardView({
  boardId,
  lists: serverLists,
  members,
  currentUserId,
  canModerate,
}: BoardViewProps) {
  // Local state drives the drag; it is replaced whenever the server sends fresh data.
  const [prevServerLists, setPrevServerLists] = useState(serverLists);
  const [lists, setLists] = useState(serverLists);
  if (serverLists !== prevServerLists) {
    setPrevServerLists(serverLists);
    setLists(serverLists);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const snapshot = useRef(lists);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allTasks = lists.flatMap((list) => list.tasks);
  const activeTask = activeId ? allTasks.find((task) => task.id === activeId) : undefined;
  const editingTask = editingId ? (allTasks.find((task) => task.id === editingId) ?? null) : null;

  function handleDragStart({ active }: DragStartEvent) {
    snapshot.current = lists;
    setMoveError(null);
    setActiveId(String(active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeRect = active.rect.current.translated;
    const isBelowOver = !!activeRect && activeRect.top > over.rect.top + over.rect.height;
    setLists((current) => moveAcrossLists(current, String(active.id), over.id, isBelowOver));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) {
      setLists(snapshot.current);
      return;
    }

    const taskId = String(active.id);
    let next = lists;

    // Reordering inside one list never triggers dragOver, so apply it here.
    const listId = listIdOf(lists, taskId);
    if (listId && listIdOf(lists, over.id) === listId) {
      const tasks = lists.find((list) => list.id === listId)!.tasks;
      const from = tasks.findIndex((task) => task.id === taskId);
      const to = tasks.findIndex((task) => task.id === over.id);
      if (to !== -1 && from !== to) {
        next = lists.map((list) =>
          list.id === listId ? { ...list, tasks: arrayMove(list.tasks, from, to) } : list,
        );
      }
    }

    setLists(next);
    persistMove(taskId, snapshot.current, next);
  }

  function handleDragCancel() {
    setActiveId(null);
    setLists(snapshot.current);
  }

  function persistMove(taskId: string, before: ListDTO[], after: ListDTO[]) {
    const fromList = before.find((list) => list.tasks.some((task) => task.id === taskId))!;
    const toList = after.find((list) => list.tasks.some((task) => task.id === taskId))!;
    const fromIndex = fromList.tasks.findIndex((task) => task.id === taskId);
    const toIndex = toList.tasks.findIndex((task) => task.id === taskId);
    if (fromList.id === toList.id && fromIndex === toIndex) return;

    const prevId = toList.tasks[toIndex - 1]?.id ?? null;
    const nextId = toList.tasks[toIndex + 1]?.id ?? null;

    const rollback = (message: string) => {
      setLists(before);
      setMoveError(message);
      router.refresh();
    };
    moveTask(taskId, toList.id, prevId, nextId)
      .then((result) => {
        if (result?.error) rollback(result.error);
      })
      .catch(() => rollback("Couldn't save the move. Check your connection and try again."));
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        id={`board-${boardId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <ListColumn key={list.id} list={list} members={members} onOpenTask={setEditingId} />
          ))}
          <div className="w-72 shrink-0">
            <NameForm
              action={createList.bind(null, boardId)}
              label="List name"
              placeholder="Add another list"
              submitLabel="Add"
              pendingLabel="..."
            />
          </div>
        </div>
        <DragOverlay>
          {activeTask ? <TaskCardBody task={activeTask} members={members} /> : null}
        </DragOverlay>
      </DndContext>

      {moveError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {moveError}
        </p>
      )}

      <TaskDialog
        task={editingTask}
        members={members}
        currentUserId={currentUserId}
        canModerate={canModerate}
        onClose={() => setEditingId(null)}
      />
    </div>
  );
}
