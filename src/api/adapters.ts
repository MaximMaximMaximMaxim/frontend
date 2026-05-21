import type {
  ColumnRead,
  ColumnType,
  TaskCreate,
  TaskPriority,
  TaskRead,
  TaskUpdate,
} from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

export interface ColumnWithTasks extends ColumnRead {
  tasks: Task[];
}

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
];

export const COLUMN_TYPE_OPTIONS: Array<{ value: ColumnType; label: string }> = [
  { value: "backlog", label: "Бэклог" },
  { value: "in_progress", label: "В работе" },
  { value: "review", label: "Проверка" },
  { value: "done", label: "Готово" },
  { value: "fix", label: "Исправление" },
  { value: "archived", label: "Архив" },
  { value: "custom", label: "Пользовательский" },
];

const priorityValues = new Set(TASK_PRIORITY_OPTIONS.map((option) => option.value));

function parseOptionalInteger(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function toIsoDateTime(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const date = new Date(trimmedValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sortTasks(left: TaskRead, right: TaskRead): number {
  return (
    new Date(left.created_at).getTime() - new Date(right.created_at).getTime() ||
    left.id - right.id
  );
}

export function formatColumnType(columnType: ColumnType): string {
  return (
    COLUMN_TYPE_OPTIONS.find((option) => option.value === columnType)?.label ??
    columnType
  );
}

export function formatTaskPriority(priority: TaskPriority | null | undefined): string {
  return priority
    ? TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority
    : "—";
}

export function formatDateTimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function mapApiTaskToTask(apiTask: TaskRead, column: ColumnRead | null): Task {
  return {
    ...apiTask,
    description: apiTask.description ?? "",
    columnName: column?.name ?? "Без колонки",
    columnType: column?.column_type ?? "custom",
  };
}

export function buildColumnsWithTasks(columns: ColumnRead[], tasks: TaskRead[]): ColumnWithTasks[] {
  const visibleColumns = columns
    .filter((column) => !column.is_archived)
    .slice()
    .sort((left, right) => left.position - right.position || left.id - right.id);
  const columnsById = new Map(visibleColumns.map((column) => [column.id, column]));
  const tasksByColumnId = new Map<number, Task[]>();

  for (const task of tasks.slice().sort(sortTasks)) {
    const column = columnsById.get(task.column_id);

    if (!column) {
      continue;
    }

    const taskWithColumn = mapApiTaskToTask(task, column);
    const columnTasks = tasksByColumnId.get(column.id) ?? [];
    columnTasks.push(taskWithColumn);
    tasksByColumnId.set(column.id, columnTasks);
  }

  return visibleColumns.map((column) => ({
    ...column,
    tasks: tasksByColumnId.get(column.id) ?? [],
  }));
}

export function flattenColumnTasks(columns: ColumnWithTasks[]): Task[] {
  return columns.flatMap((column) => column.tasks);
}

export function buildTaskCreatePayload(
  values: TaskFormValues,
  projectId: number,
): TaskCreate {
  const payload: TaskCreate = {
    project_id: projectId,
    column_id: values.columnId,
    title: values.title.trim(),
  };

  const description = values.description.trim();
  const estimate = parseOptionalInteger(values.estimate);
  const dueDate = toIsoDateTime(values.dueDate);
  const assignedToId = parseOptionalInteger(values.assignedToId);

  if (description) {
    payload.description = description;
  }

  if (priorityValues.has(values.priority)) {
    payload.priority = values.priority;
  }

  if (estimate !== null) {
    payload.estimate = estimate;
  }

  if (dueDate !== null) {
    payload.due_date = dueDate;
  }

  if (assignedToId !== null) {
    payload.assigned_to_id = assignedToId;
  }

  return payload;
}

export function buildTaskUpdatePayload(values: TaskFormValues): TaskUpdate {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: priorityValues.has(values.priority) ? values.priority : "medium",
    estimate: parseOptionalInteger(values.estimate),
    due_date: toIsoDateTime(values.dueDate),
    assigned_to_id: parseOptionalInteger(values.assignedToId),
  };
}
