import { apiRequest } from "./client";
import type { AnalyticsSummary } from "../types/api";

export function getAnalyticsSummary(
  params: { start?: string; end?: string; projectId?: number; boardId?: number } = {},
) {
  const searchParams = new URLSearchParams();

  if (params.projectId) {
    searchParams.set("project_id", String(params.projectId));
  }

  if (params.boardId) {
    searchParams.set("board_id", String(params.boardId));
  }

  if (params.start) {
    searchParams.set("start", params.start);
  }

  if (params.end) {
    searchParams.set("end", params.end);
  }

  const query = searchParams.toString();
  return apiRequest<AnalyticsSummary>(`/analytics/summary${query ? `?${query}` : ""}`);
}
