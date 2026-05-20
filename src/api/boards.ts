import { apiRequest, jsonBody } from "./client";
import type { BoardCreate, BoardDetail, BoardOut, BoardUpdate } from "../types/api";

export function listBoards(): Promise<BoardOut[]> {
  return apiRequest<BoardOut[]>("/boards");
}

export function createBoard(payload: BoardCreate): Promise<BoardOut> {
  return apiRequest<BoardOut>("/boards", {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function getBoard(boardId: number): Promise<BoardDetail> {
  return apiRequest<BoardDetail>(`/boards/${boardId}`);
}

export function updateBoard(boardId: number, payload: BoardUpdate): Promise<BoardOut> {
  return apiRequest<BoardOut>(`/boards/${boardId}`, {
    method: "PUT",
    body: jsonBody(payload),
  });
}

export function deleteBoard(boardId: number): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${boardId}`, {
    method: "DELETE",
  });
}
