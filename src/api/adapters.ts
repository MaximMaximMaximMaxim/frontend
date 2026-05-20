import type { CardCreate, CardOut, CardUpdate, ColumnWithCards } from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

export function mapApiTaskToTask(apiTask: CardOut, column: ColumnWithCards): Task {
  return {
    ...apiTask,
    position: apiTask.position ?? 0,
    description: apiTask.description ?? "",
    columnId: column.id,
    columnTitle: column.title,
  };
}

export function mapTaskToApiPayload(
  task: TaskFormValues,
  includeColumnId = false,
): CardCreate | CardUpdate {
  const payload: CardCreate | CardUpdate = {
    title: task.title.trim(),
    description: task.description.trim() || null,
    position: Number.isFinite(task.position) ? task.position : 0,
  };

  if (includeColumnId) {
    return {
      ...payload,
      column_id: task.columnId,
    };
  }

  return payload;
}

export function flattenBoardTasks(columns: ColumnWithCards[]): Task[] {
  return columns
    .flatMap((column) => column.cards.map((card) => mapApiTaskToTask(card, column)))
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0) || left.id - right.id);
}
