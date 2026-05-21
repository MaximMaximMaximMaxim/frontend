import { apiRequest, jsonBody } from "./client";
import type { BoardCreate, BoardRead } from "../types/api";

export function listBoards(projectId: number): Promise<BoardRead[]> {
  return apiRequest<BoardRead[]>(`/boards/?project_id=${projectId}`);
}

export function createBoard(payload: BoardCreate): Promise<BoardRead> {
  return apiRequest<BoardRead>("/boards/", {
    method: "POST",
    body: jsonBody(payload),
  });
}
