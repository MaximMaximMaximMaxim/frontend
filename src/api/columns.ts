import { apiRequest, jsonBody } from "./client";
import type { ColumnCreate, ColumnRead } from "../types/api";

export function listColumns(boardId: number): Promise<ColumnRead[]> {
  return apiRequest<ColumnRead[]>(`/boards/${boardId}/columns`);
}

export function createColumn(boardId: number, payload: ColumnCreate): Promise<ColumnRead> {
  return apiRequest<ColumnRead>(`/boards/${boardId}/columns`, {
    method: "POST",
    body: jsonBody(payload),
  });
}
