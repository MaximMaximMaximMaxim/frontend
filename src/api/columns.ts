import { apiRequest, jsonBody } from "./client";
import type { ColumnCreate, ColumnOut, ColumnUpdate } from "../types/api";

export function listColumns(boardId: number): Promise<ColumnOut[]> {
  return apiRequest<ColumnOut[]>(`/boards/${boardId}/columns`);
}

export function createColumn(boardId: number, payload: ColumnCreate): Promise<ColumnOut> {
  return apiRequest<ColumnOut>(`/boards/${boardId}/columns`, {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function updateColumn(columnId: number, payload: ColumnUpdate): Promise<ColumnOut> {
  return apiRequest<ColumnOut>(`/columns/${columnId}`, {
    method: "PUT",
    body: jsonBody(payload),
  });
}

export function deleteColumn(columnId: number): Promise<unknown> {
  return apiRequest<unknown>(`/columns/${columnId}`, {
    method: "DELETE",
  });
}
