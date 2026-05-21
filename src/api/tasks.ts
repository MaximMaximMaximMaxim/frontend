import { apiRequest, jsonBody } from "./client";
import type { TaskCreate, TaskMove, TaskRead, TaskUpdate } from "../types/api";

export function listTasks(projectId: number): Promise<TaskRead[]> {
  return apiRequest<TaskRead[]>(`/tasks/?project_id=${projectId}`);
}

export function createTask(payload: TaskCreate): Promise<TaskRead> {
  return apiRequest<TaskRead>("/tasks/", {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function getTask(taskId: number): Promise<TaskRead> {
  return apiRequest<TaskRead>(`/tasks/${taskId}`);
}

export function updateTask(taskId: number, payload: TaskUpdate): Promise<TaskRead> {
  return apiRequest<TaskRead>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: jsonBody(payload),
  });
}

export function moveTask(taskId: number, payload: TaskMove): Promise<TaskRead> {
  return apiRequest<TaskRead>(`/tasks/${taskId}/move`, {
    method: "POST",
    body: jsonBody(payload),
  });
}
