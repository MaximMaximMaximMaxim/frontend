import { apiRequest } from "./client";
import type { AiInsight, MetricSnapshot } from "../types/insights";

interface InsightParams {
  projectId?: number;
  boardId?: number;
}

function buildInsightQuery(params: InsightParams): string {
  const searchParams = new URLSearchParams();

  if (params.projectId) {
    searchParams.set("project_id", String(params.projectId));
  }

  if (params.boardId) {
    searchParams.set("board_id", String(params.boardId));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listMetricSnapshots(params: InsightParams = {}) {
  return apiRequest<MetricSnapshot[]>(`/analytics/metrics${buildInsightQuery(params)}`);
}

export function listAiInsights(params: InsightParams = {}) {
  return apiRequest<AiInsight[]>(`/analytics/ai-insights${buildInsightQuery(params)}`);
}
