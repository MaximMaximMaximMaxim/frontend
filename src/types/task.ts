import type { CardOut } from "./api";

export interface Task extends CardOut {
  columnId: number;
  columnTitle: string;
}

export interface TaskFormValues {
  id?: number;
  title: string;
  description: string;
  position: number;
  columnId: number;
}
