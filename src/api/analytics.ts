import { apiRequest } from "./client";
import type { AnalyticsMetaMetrics, AnalyticsMetrics, AnalyticsSummary } from "../types/api";

export const DEFAULT_ANALYTICS_METRIC_KEYS = [
  "lead_time_hours_avg",
  "cycle_time_hours_avg",
  "touch_time_hours_avg",
  "queue_time_hours_avg",
  "time_in_status_hours_avg",
  "flow_efficiency",
  "throughput",
  "status_counts",
  "work_started",
  "work_finished",
  "wip",
  "wip_by_column",
  "sla_compliance",
  "on_time_delivery",
  "commitment_reliability",
  "bug_count",
  "bug_fix_time_hours_avg",
  "reopen_rate",
  "rework_rate",
  "story_points_done",
  "high_priority_throughput",
  "aging_wip_count",
  "aging_wip_rate",
  "aging_backlog_count",
  "aging_backlog_rate",
  "total_throughput",
  "priority_mix",
  "flow_efficiency_by_board",
  "work_type_mix",
] as const;

export const DEFAULT_ANALYTICS_META_METRIC_KEYS = [
  "lead_time_percentiles_hours",
  "cycle_time_percentiles_hours",
  "lead_time_std_dev_hours",
  "lead_time_cov",
  "cycle_time_std_dev_hours",
  "cycle_time_cov",
  "trend_rolling_avg",
  "aging_index",
  "wip_to_throughput_ratio",
  "littles_law_check",
  "queue_dominance",
  "predictability_score",
  "aging_outliers",
  "flow_debt",
  "cross_team_variance",
  "bottleneck_detection",
  "flow_balance_score",
  "workload_inequality_gini",
] as const;

interface AnalyticsRequestParams {
  projectId?: number | null;
  boardId?: number | null;
  start?: string;
  end?: string;
  metrics?: readonly string[];
  agingDays?: number;
  lte?: readonly string[];
  gte?: readonly string[];
  eq?: readonly string[];
}

function buildAnalyticsQuery(params: AnalyticsRequestParams): string {
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

  if (params.metrics?.length) {
    searchParams.set("metrics", params.metrics.join(","));
  }

  if (params.agingDays) {
    searchParams.set("aging_days", String(params.agingDays));
  }

  params.lte?.forEach((operation) => searchParams.append("lte", operation));
  params.gte?.forEach((operation) => searchParams.append("gte", operation));
  params.eq?.forEach((operation) => searchParams.append("eq", operation));

  return searchParams.toString();
}

export function getAnalyticsSummary(
  params: { start?: string; end?: string } = {},
) {
  const searchParams = new URLSearchParams();

  if (params.start) {
    searchParams.set("start", params.start);
  }

  if (params.end) {
    searchParams.set("end", params.end);
  }

  const query = searchParams.toString();
  return apiRequest<AnalyticsSummary>(`/analytics/summary${query ? `?${query}` : ""}`);
}

export function getAnalyticsMetrics(params: AnalyticsRequestParams = {}) {
  const query = buildAnalyticsQuery({
    metrics: DEFAULT_ANALYTICS_METRIC_KEYS,
    agingDays: 7,
    ...params,
  });

  return apiRequest<AnalyticsMetrics>(`/analytics/metrics${query ? `?${query}` : ""}`);
}

export function getAnalyticsMetaMetrics(params: AnalyticsRequestParams = {}) {
  const query = buildAnalyticsQuery({
    metrics: DEFAULT_ANALYTICS_META_METRIC_KEYS,
    agingDays: 7,
    ...params,
  });

  return apiRequest<AnalyticsMetaMetrics>(
    `/analytics/metametrics${query ? `?${query}` : ""}`,
  );
}
