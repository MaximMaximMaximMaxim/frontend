import { apiRequest, jsonBody } from "./client";
import type { CardCreate, CardOut, CardUpdate } from "../types/api";

export function listCards(columnId: number): Promise<CardOut[]> {
  return apiRequest<CardOut[]>(`/columns/${columnId}/cards`);
}

export function createCard(columnId: number, payload: CardCreate): Promise<CardOut> {
  return apiRequest<CardOut>(`/columns/${columnId}/cards`, {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function updateCard(cardId: number, payload: CardUpdate): Promise<CardOut> {
  return apiRequest<CardOut>(`/cards/${cardId}`, {
    method: "PUT",
    body: jsonBody(payload),
  });
}

export function deleteCard(cardId: number): Promise<unknown> {
  return apiRequest<unknown>(`/cards/${cardId}`, {
    method: "DELETE",
  });
}
