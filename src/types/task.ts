import type { ColumnType, TaskPriority, TaskRead } from "./api";

export interface Task extends TaskRead {
  columnName: string;
  columnType: ColumnType;
}

export interface TaskFormValues {
  id?: number;
  title: string;
  description: string;
  priority: TaskPriority;
  estimate: string;
  dueDate: string;
  assignedToId: string;
  columnId: number;
}
