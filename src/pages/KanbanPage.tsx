import { useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
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
  isDropPreviewVisible: boolean;
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
const DND_MEASURING = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

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

function getOverColumnId(over: DragEndEvent["over"] | DragOverEvent["over"]): number | null {
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
    "kanban-card",
    isDisabled
      ? "cursor-default"
      : "cursor-grab active:cursor-grabbing",
    isDragging ? "kanban-card--dragging" : "",
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
    <article className="kanban-card kanban-card--overlay">
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

function KanbanDropPreview({ isVisible }: { isVisible: boolean }) {
  const previewClassName = [
    "kanban-drop-preview overflow-hidden",
    isVisible ? "kanban-drop-preview--visible" : "",
  ].join(" ");

  return (
    <div aria-hidden="true" className={previewClassName}>
      <div className="rounded-lg border border-dashed p-4 shadow-inner" style={{ borderColor: "var(--primary)", background: "var(--surface)" }}>
        <div className="flex items-center gap-3">
          <span className="h-10 w-1.5 rounded-full" style={{ background: "var(--primary)" }} />
          <span className="grid flex-1 gap-2">
            <span className="h-2.5 w-2/3 rounded-full" style={{ background: "var(--primary-soft)" }} />
            <span className="h-2 w-1/2 rounded-full bg-slate-200" />
            <span className="h-2 w-5/6 rounded-full bg-slate-100" />
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  columns,
  isDropPreviewVisible,
  isDisabled,
  onMoveTask,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: getColumnDropId(column.id),
    data: {
      columnId: column.id,
      type: "column",
    },
    disabled: isDisabled,
  });

  const columnClassName = [
    "kanban-column",
    isOver ? "kanban-column--over" : "",
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
        <span className="column-count">
          {column.tasks.length}
        </span>
      </div>

      <KanbanDropPreview isVisible={isDropPreviewVisible} />

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
      ) : isDropPreviewVisible ? null : (
        <p className="flex min-h-[7rem] items-center justify-center rounded-md border border-dashed px-3 py-6 text-center text-sm text-slate-500">
          В этом этапе пока нет задач.
        </p>
      )}
    </div>
  );
}

function KanbanInsightsPanel({ columns }: { columns: ColumnWithTasks[] }) {
  const totalTasks = columns.reduce((total, column) => total + column.tasks.length, 0);
  const completedTasks = columns
    .filter((column) => column.column_type === "done")
    .reduce((total, column) => total + column.tasks.length, 0);
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <aside className="kanban-sidebar">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Аналитика</h3>
          <p className="mt-1 text-xs text-slate-500">Распределение по этапам</p>
        </div>
        <span className="column-count">{totalTasks}</span>
      </div>

      <div className="mt-5 grid gap-3">
        {columns.map((column) => {
          const percent = totalTasks > 0 ? Math.round((column.tasks.length / totalTasks) * 100) : 0;

          return (
            <div key={column.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-slate-600">{column.name}</span>
                <span className="font-semibold text-slate-950">{column.tasks.length}</span>
              </div>
              <div className="progress-track">
                <div className="progress-value" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Выполнение
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{completionPercent}%</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Блок готов для расширения AI-рекомендациями и прогнозами после появления API.
        </p>
      </div>
    </aside>
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
  const [activeDropColumnId, setActiveDropColumnId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const dragData = getTaskDragData(event.active.data.current);

    setActiveDrag(dragData);
    setActiveDropColumnId(dragData?.sourceColumnId ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const targetColumnId = getOverColumnId(event.over);

    setActiveDropColumnId((currentColumnId) =>
      currentColumnId === targetColumnId ? currentColumnId : targetColumnId,
    );
  }

  function clearDragState() {
    setActiveDrag(null);
    setActiveDropColumnId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = activeDrag ?? getTaskDragData(event.active.data.current);
    const targetColumnId = getOverColumnId(event.over) ?? activeDropColumnId;
    clearDragState();

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
      <section className="page-panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Канбан</h2>
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
          measuring={DND_MEASURING}
          sensors={sensors}
          onDragCancel={clearDragState}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
        >
          <section className="kanban-workspace">
            <div className="kanban-board-grid">
              {columns.map((column) => {
                const isDropPreviewVisible =
                  activeDrag !== null &&
                  activeDropColumnId === column.id &&
                  activeDrag.sourceColumnId !== column.id;

                return (
                  <KanbanColumn
                    column={column}
                    columns={columns}
                    isDropPreviewVisible={isDropPreviewVisible}
                    isDisabled={isMutating}
                    key={column.id}
                    onMoveTask={onMoveTask}
                  />
                );
              })}
            </div>
            <KanbanInsightsPanel columns={columns} />
          </section>
          <DragOverlay>{activeDrag ? <KanbanTaskOverlay task={activeDrag.task} /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
