export type IntegrationStatus = "ready" | "waiting";

export interface DashboardIntegrationItem {
  id: string;
  title: string;
  status: IntegrationStatus;
  statusLabel: string;
  description: string;
  endpoint: string;
}

export interface MetricSnapshot {
  key: string;
  label: string;
  value: number | string;
  unit?: string | null;
  trend?: number | null;
  updated_at?: string | null;
}

export type AiInsightSeverity = "info" | "warning" | "critical";

export interface AiInsight {
  id: string;
  title: string;
  summary: string;
  severity: AiInsightSeverity;
  created_at: string;
  recommended_actions?: string[];
}
