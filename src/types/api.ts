export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectRead {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface BoardCreate {
  project_id: number;
  name: string;
  is_default?: boolean;
}

export interface BoardRead {
  id: number;
  project_id: number;
  name: string;
  is_default: boolean;
  created_at: string;
}

export type ColumnType =
  | "backlog"
  | "in_progress"
  | "review"
  | "done"
  | "fix"
  | "archived"
  | "custom";

export interface ColumnCreate {
  name: string;
  position: number;
  column_type?: ColumnType;
}

export interface ColumnRead {
  id: number;
  board_id: number;
  name: string;
  position: number;
  column_type: ColumnType;
  is_archived: boolean;
  created_at: string;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskCreate {
  project_id: number;
  column_id: number;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  estimate?: number | null;
  due_date?: string | null;
  created_by_id?: number | null;
  assigned_to_id?: number | null;
}

export interface TaskRead {
  id: number;
  project_id: number;
  board_id: number;
  column_id: number;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  estimate?: number | null;
  due_date?: string | null;
  created_by_id?: number | null;
  assigned_to_id?: number | null;
  is_bug: boolean;
  started_at?: string | null;
  completed_at?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface TaskUpdate {
  title?: string | null;
  description?: string | null;
  priority?: TaskPriority | null;
  estimate?: number | null;
  due_date?: string | null;
  assigned_to_id?: number | null;
}

export interface TaskMove {
  column_id: number;
}

export interface AnalyticsSummary {
  total_by_status: Record<string, number>;
  average_completion_time_hours: number | null;
  completed_tasks: number;
  bug_tasks: number;
  average_time_to_start_hours: number | null;
  average_bug_close_time_hours: number | null;
  completion_ratio: number | null;
  closed_in_period: number;
  overdue_tasks: number;
}

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}
