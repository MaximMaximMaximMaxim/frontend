import type { CSSProperties } from "react";
import { formatColumnType, type ColumnWithTasks } from "../api/adapters";
import { DashboardIntegrationPanel } from "../components/DashboardIntegrationPanel";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import type { AnalyticsSummary, BoardRead, ProjectRead } from "../types/api";
import type { DashboardIntegrationItem } from "../types/insights";
import type { Task } from "../types/task";

interface DashboardPageProps {
  projects: ProjectRead[];
  boards: BoardRead[];
  activeProject: ProjectRead | null;
  activeBoard: BoardRead | null;
  columns: ColumnWithTasks[];
  tasks: Task[];
  analyticsSummary: AnalyticsSummary | null;
  healthStatus: string | null;
}

interface Tone {
  color: string;
  soft: string;
}

const STAGE_TONES: Tone[] = [
  { color: "var(--stage-primary)", soft: "var(--stage-primary-soft)" },
  { color: "var(--stage-secondary)", soft: "var(--stage-secondary-soft)" },
  { color: "var(--stage-warning)", soft: "var(--stage-warning-soft)" },
  { color: "var(--stage-accent)", soft: "var(--stage-accent-soft)" },
  { color: "var(--stage-success)", soft: "var(--stage-success-soft)" },
  { color: "var(--stage-muted)", soft: "var(--stage-muted-soft)" },
];

const DASHBOARD_INTEGRATION_ITEMS: DashboardIntegrationItem[] = [
  {
    id: "team-metrics",
    title: "Командные метрики",
    status: "waiting",
    statusLabel: "Ожидает API",
    description:
      "Сводки по людям, отделам, нагрузке и пропускной способности команды.",
    endpoint: "GET /analytics/metrics",
  },
  {
    id: "ai-insights",
    title: "AI-инсайты",
    status: "waiting",
    statusLabel: "Ожидает API",
    description:
      "Риски, узкие места и рекомендуемые действия от аналитического агента.",
    endpoint: "GET /analytics/ai-insights",
  },
  {
    id: "executive-dashboards",
    title: "Расширенные дашборды",
    status: "waiting",
    statusLabel: "Ожидает API",
    description:
      "Готовая зона под графики SLA, дедлайнов, багов и динамики закрытия.",
    endpoint: "GET /analytics/dashboards",
  },
];

function formatNullableNumber(value: number | null | undefined, suffix = ""): string {
  if (value == null) {
    return "—";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function formatRatio(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(0)}%`;
}

function getRatioPercent(value: number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  const percentage = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

function getMeterStyle(tone: Tone, progress: number): CSSProperties {
  return {
    "--stage-color": tone.color,
    "--stage-soft": tone.soft,
    "--stage-progress": `${progress}%`,
  } as CSSProperties;
}

export function DashboardPage({
  projects,
  boards,
  activeProject,
  activeBoard,
  columns,
  tasks,
  analyticsSummary,
  healthStatus,
}: DashboardPageProps) {
  const maxColumnTasks = Math.max(...columns.map((column) => column.tasks.length), 0);
  const columnDistribution = columns.map((column, index) => {
    const tasksInColumn = column.tasks.length;
    const rawProgress = maxColumnTasks > 0 ? (tasksInColumn / maxColumnTasks) * 100 : 0;

    return {
      id: column.id,
      name: column.name,
      typeLabel: formatColumnType(column.column_type),
      tasks: tasksInColumn,
      progress: tasksInColumn > 0 ? Math.max(8, Math.round(rawProgress)) : 0,
      tone: STAGE_TONES[index % STAGE_TONES.length],
    };
  });
  const actualTasks = tasks.slice(0, 6);
  const completionPercent = getRatioPercent(analyticsSummary?.completion_ratio);
  const riskItems = [
    {
      label: "Просрочено",
      value: analyticsSummary?.overdue_tasks ?? 0,
      description: "Нужна реакция",
      tone: { color: "var(--stage-danger)", soft: "var(--stage-danger-soft)" },
    },
    {
      label: "Баги",
      value: analyticsSummary?.bug_tasks ?? 0,
      description: "Технический долг",
      tone: { color: "var(--stage-warning)", soft: "var(--stage-warning-soft)" },
    },
    {
      label: "Закрыто",
      value: analyticsSummary?.closed_in_period ?? 0,
      description: "За период",
      tone: { color: "var(--stage-success)", soft: "var(--stage-success-soft)" },
    },
  ];

  return (
    <div className="space-y-6">
      <section className="page-panel p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Дашборд</h2>
            <p className="mt-1 text-sm text-slate-600">
              {activeProject ? `Проект: ${activeProject.name}` : "Проект не выбран"}
              {activeBoard ? ` · Доска: ${activeBoard.name}` : ""}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500">
            API health: {healthStatus ?? "не проверен"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Проектов" value={projects.length} />
          <MetricCard label="Досок в проекте" value={boards.length} />
          <MetricCard label="Активных этапов" value={columns.length} />
          <MetricCard label="Задач на доске" value={tasks.length} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Завершено задач" value={analyticsSummary?.completed_tasks ?? "—"} />
        <MetricCard label="Багов" value={analyticsSummary?.bug_tasks ?? "—"} />
        <MetricCard label="Просрочено" value={analyticsSummary?.overdue_tasks ?? "—"} />
        <MetricCard label="Готовность" value={formatRatio(analyticsSummary?.completion_ratio)} />
        <MetricCard
          label="Закрыто за период"
          value={analyticsSummary?.closed_in_period ?? "—"}
        />
        <MetricCard
          label="Среднее завершение"
          value={formatNullableNumber(analyticsSummary?.average_completion_time_hours, " ч")}
          description={
            analyticsSummary?.average_completion_time_hours == null
              ? "Недостаточно данных"
              : undefined
          }
        />
        <MetricCard
          label="Среднее до старта"
          value={formatNullableNumber(analyticsSummary?.average_time_to_start_hours, " ч")}
          description={
            analyticsSummary?.average_time_to_start_hours == null
              ? "Недостаточно данных"
              : undefined
          }
        />
        <MetricCard
          label="Среднее закрытие багов"
          value={formatNullableNumber(analyticsSummary?.average_bug_close_time_hours, " ч")}
          description={
            analyticsSummary?.average_bug_close_time_hours == null
              ? "Недостаточно данных"
              : undefined
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="panel analytics-card min-w-0 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Задачи по этапам</h3>
              <p className="text-sm text-slate-600">
                Живой срез по колонкам текущей доски.
              </p>
            </div>
            <span className="analytics-chip">{tasks.length} задач</span>
          </div>

          {columnDistribution.length > 0 ? (
            <div className="stage-distribution">
              {columnDistribution.map((column) => (
                <article
                  className="stage-row"
                  key={column.id}
                  style={getMeterStyle(column.tone, column.progress)}
                >
                  <div className="stage-row-header">
                    <div className="min-w-0">
                      <h4>{column.name}</h4>
                      <p>{column.typeLabel}</p>
                    </div>
                    <strong>{column.tasks}</strong>
                  </div>
                  <div
                    aria-label={`${column.name}: ${column.tasks} задач`}
                    className="stage-meter"
                    role="img"
                  >
                    <span className="stage-meter-fill" />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                description="Добавьте этапы и задачи на выбранной доске, чтобы увидеть распределение."
                title="Нет данных для графика"
              />
            </div>
          )}
        </div>

        <div className="panel analytics-card min-w-0 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Операционный фокус</h3>
            <p className="text-sm text-slate-600">
              Короткая сводка без технических статусов API.
            </p>
          </div>

          <div
            className="completion-card"
            style={getMeterStyle(
              { color: "var(--stage-primary)", soft: "var(--stage-primary-soft)" },
              completionPercent,
            )}
          >
            <div>
              <span>Готовность доски</span>
              <strong>{formatRatio(analyticsSummary?.completion_ratio)}</strong>
            </div>
            <div aria-label={`Готовность доски: ${completionPercent}%`} className="stage-meter" role="img">
              <span className="stage-meter-fill" />
            </div>
          </div>

          <div className="risk-grid">
            {riskItems.map((item) => (
              <article className="risk-card" key={item.label} style={getMeterStyle(item.tone, 100)}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-lg font-semibold text-slate-950">Актуальные задачи</h3>
        {actualTasks.length > 0 ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actualTasks.map((task) => (
              <li className="rounded-md border border-slate-200 p-3" key={task.id}>
                <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">{task.columnName}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            На выбранной доске пока нет задач.
          </p>
        )}
      </section>

      <DashboardIntegrationPanel items={DASHBOARD_INTEGRATION_ITEMS} />
    </div>
  );
}
