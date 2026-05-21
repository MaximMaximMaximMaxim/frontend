import { useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS as DndCSS } from "@dnd-kit/utilities";
import { formatColumnType } from "../api/adapters";
import type { ColumnWithTasks } from "../api/adapters";
import { ColumnForm } from "../components/ColumnForm";
import { EmptyState } from "../components/EmptyState";
import type { BoardRead, ColumnType } from "../types/api";
import type { Task } from "../types/task";

interface KanbanPageProps {
  activeBoard: BoardRead | null;
  columns: ColumnWithTasks[];
  isMutating: boolean;
  onCreateColumn: (name: string, columnType: ColumnType) => void;
  onMoveTask: (task: Task, columnId: number) => Promise<void>;
}

interface ActiveTaskDrag {
  task: Task;
  sourceColumnId: number;
}

interface KanbanColumnProps {
  column: ColumnWithTasks;
  columns: ColumnWithTasks[];
  isDisabled: boolean;
  onMoveTask: (task: Task, columnId: number) => Promise<void>;
}

interface DraggableKanbanTaskCardProps {
  task: Task;
  columnId: number;
  columns: ColumnWithTasks[];
  isDisabled: boolean;
  onMoveTask: (task: Task, columnId: number) => Promise<void>;
}

interface KanbanTaskContentProps {
  task: Task;
  columnId: number;
  columns: ColumnWithTasks[];
  isDisabled: boolean;
  showMoveSelect?: boolean;
  onMoveTask?: (task: Task, columnId: number) => Promise<void>;
}

const TASK_DRAG_PREFIX = "task-";
const COLUMN_DROP_PREFIX = "column-";

function getTaskDragId(taskId: number): string {
  return `${TASK_DRAG_PREFIX}${taskId}`;
}

function getColumnDropId(columnId: number): string {
  return `${COLUMN_DROP_PREFIX}${columnId}`;
}

function getTaskDragData(data: unknown): ActiveTaskDrag | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const dragData = data as { columnId?: unknown; task?: unknown; type?: unknown };

  if (dragData.type !== "task" || typeof dragData.columnId !== "number" || !dragData.task) {
    return null;
  }

  return {
    task: dragData.task as Task,
    sourceColumnId: dragData.columnId,
  };
}

function getOverColumnId(over: DragEndEvent["over"]): number | null {
  const columnId = over?.data.current?.columnId;
  return typeof columnId === "number" ? columnId : null;
}

function KanbanTaskContent({
  task,
  columnId,
  columns,
  isDisabled,
  showMoveSelect = true,
  onMoveTask,
}: KanbanTaskContentProps) {
  return (
    <>
      <h4 className="text-sm font-semibold text-slate-950">{task.title}</h4>
      {task.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
      ) : null}
      <div className="mt-3 grid gap-1 text-xs text-slate-500">
        <span>Приоритет: {task.priority}</span>
        <span>Оценка: {task.estimate ?? "—"}</span>
      </div>

      {showMoveSelect ? (
        <>
          <label
            className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            htmlFor={`move-${task.id}`}
          >
            Переместить в этап
          </label>
          <select
            className="field mt-2"
            disabled={isDisabled}
            id={`move-${task.id}`}
            value={columnId}
            onChange={(event) => {
              const targetColumnId = Number(event.target.value);

              if (targetColumnId !== columnId) {
                void onMoveTask?.(task, targetColumnId);
              }
            }}
          >
            {columns.map((targetColumn) => (
              <option key={targetColumn.id} value={targetColumn.id}>
                {targetColumn.name}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </>
  );
}

function DraggableKanbanTaskCard({
  task,
  columnId,
  columns,
  isDisabled,
  onMoveTask,
}: DraggableKanbanTaskCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: getTaskDragId(task.id),
    data: {
      columnId,
      task,
      type: "task",
    },
    disabled: isDisabled,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.45 : undefined,
    touchAction: isDisabled ? undefined : "none",
    transform: isDragging ? undefined : DndCSS.Transform.toString(transform),
  };

  const cardClassName = [
    "rounded-lg border bg-white p-4 shadow-sm transition",
    isDisabled
      ? "cursor-default border-transparent"
      : "cursor-grab border-transparent hover:border-teal-200 hover:shadow-md active:cursor-grabbing",
    isDragging ? "border-teal-300 ring-2 ring-teal-100" : "",
  ].join(" ");

  return (
    <article
      ref={setNodeRef}
      className={cardClassName}
      style={style}
      {...attributes}
      {...listeners}
    >
      <KanbanTaskContent
        columnId={columnId}
        columns={columns}
        isDisabled={isDisabled}
        task={task}
        onMoveTask={onMoveTask}
      />
    </article>
  );
}

function KanbanTaskOverlay({ task }: { task: Task }) {
  return (
    <article className="rounded-lg border border-teal-300 bg-white p-4 shadow-xl ring-2 ring-teal-100">
      <KanbanTaskContent
        columnId={task.column_id}
        columns={[]}
        isDisabled
        showMoveSelect={false}
        task={task}
      />
    </article>
  );
}

function KanbanColumn({ column, columns, isDisabled, onMoveTask }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: getColumnDropId(column.id),
    data: {
      columnId: column.id,
      type: "column",
    },
    disabled: isDisabled,
  });

  const columnClassName = [
    "min-h-[12rem] rounded-lg border p-4 transition-colors",
    isOver
      ? "border-teal-400 bg-teal-50 ring-2 ring-teal-100"
      : "border-slate-200 bg-slate-50",
  ].join(" ");

  return (
    <div className={columnClassName} ref={setNodeRef}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{column.name}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {formatColumnType(column.column_type)}
          </p>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
          {column.tasks.length}
        </span>
      </div>

      {column.tasks.length > 0 ? (
        <div className="space-y-3">
          {column.tasks.map((task) => (
            <DraggableKanbanTaskCard
              columnId={column.id}
              columns={columns}
              isDisabled={isDisabled}
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
            />
          ))}
        </div>
      ) : (
        <p className="flex min-h-[7rem] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500">
          В этом этапе пока нет задач.
        </p>
      )}
    </div>
  );
}

export function KanbanPage({
  activeBoard,
  columns,
  isMutating,
  onCreateColumn,
  onMoveTask,
}: KanbanPageProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveTaskDrag | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(getTaskDragData(event.active.data.current));
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = activeDrag ?? getTaskDragData(event.active.data.current);
    const targetColumnId = getOverColumnId(event.over);
    setActiveDrag(null);

    if (
      !dragData ||
      targetColumnId === null ||
      targetColumnId === dragData.sourceColumnId
    ) {
      return;
    }

    void onMoveTask(dragData.task, targetColumnId);
  }

  if (!activeBoard) {
    return (
      <EmptyState
        description="Создайте или выберите доску, чтобы увидеть Kanban."
        title="Доска не выбрана"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Канбан</h2>
            <p className="mt-1 text-sm text-slate-600">
              Задачи загружаются отдельно через API задач и группируются по колонкам доски.
            </p>
          </div>
          <ColumnForm isDisabled={isMutating} onCreateColumn={onCreateColumn} />
        </div>
      </section>

      {columns.length === 0 ? (
        <EmptyState
          description="У выбранной доски нет активных этапов. Добавьте первый этап, чтобы создавать задачи."
          title="Этапы не созданы"
        />
      ) : (
        <DndContext
          collisionDetection={pointerWithin}
          sensors={sensors}
          onDragCancel={() => setActiveDrag(null)}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <section className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                column={column}
                columns={columns}
                isDisabled={isMutating}
                key={column.id}
                onMoveTask={onMoveTask}
              />
            ))}
          </section>
          <DragOverlay>{activeDrag ? <KanbanTaskOverlay task={activeDrag.task} /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
