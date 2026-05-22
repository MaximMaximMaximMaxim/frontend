import { useEffect, useMemo, type CSSProperties } from "react";
import { formatColumnType, TASK_PRIORITY_OPTIONS, type ColumnWithTasks } from "../api/adapters";
import { EmptyState } from "../components/EmptyState";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PriorityBadge } from "../components/PriorityBadge";
import type {
  AnalyticsMetaMetrics,
  AnalyticsMetrics,
  AnalyticsSummary,
  AnalyticsValue,
  BoardRead,
  ProjectRead,
  TaskPriority,
} from "../types/api";
import type { Task } from "../types/task";

interface MetricsPageProps {
  projects: ProjectRead[];
  boards: BoardRead[];
  activeProject: ProjectRead | null;
  activeBoard: BoardRead | null;
  columns: ColumnWithTasks[];
  tasks: Task[];
  analyticsSummary: AnalyticsSummary | null;
  analyticsMetrics: AnalyticsMetrics | null;
  analyticsMetaMetrics: AnalyticsMetaMetrics | null;
  analyticsError: string | null;
  isLoading: boolean;
  onRefreshMetrics: () => Promise<AnalyticsSummary | null>;
}

interface DistributionItem {
  key: string;
  label: string;
  value: number;
}

interface MetricDefinition {
  key: string;
  label: string;
  format?: "integer" | "hours" | "ratio" | "number";
}

type AnalyticsObject = Record<string, AnalyticsValue>;

const API_METRIC_CARDS: MetricDefinition[] = [
  { key: "throughput", label: "Завершено за период", format: "integer" },
  { key: "work_started", label: "Начато за период", format: "integer" },
  { key: "work_finished", label: "Закрыто за период", format: "integer" },
  { key: "wip", label: "Сейчас в работе", format: "integer" },
  { key: "bug_count", label: "Баги", format: "integer" },
  { key: "story_points_done", label: "Оценка закрытых задач", format: "integer" },
  { key: "lead_time_hours_avg", label: "От создания до закрытия", format: "hours" },
  { key: "cycle_time_hours_avg", label: "От начала работы до закрытия", format: "hours" },
  { key: "flow_efficiency", label: "Доля активной работы", format: "ratio" },
  { key: "on_time_delivery", label: "Закрыто в срок", format: "ratio" },
  { key: "commitment_reliability", label: "Доведено до конца", format: "ratio" },
  { key: "aging_wip_count", label: "Давно в работе", format: "integer" },
];

const API_META_CARDS: MetricDefinition[] = [
  { key: "predictability_score", label: "Стабильность сроков", format: "number" },
  { key: "wip_to_throughput_ratio", label: "Нагрузка к закрытию", format: "number" },
  { key: "flow_debt", label: "Незакрытый прирост задач", format: "integer" },
  { key: "aging_index", label: "Доля старых задач", format: "ratio" },
  { key: "flow_balance_score", label: "Баланс входа и закрытия", format: "ratio" },
  { key: "workload_inequality_gini", label: "Неравномерность нагрузки", format: "number" },
  { key: "lead_time_cov", label: "Разброс времени закрытия", format: "number" },
  { key: "cycle_time_cov", label: "Разброс времени работы", format: "number" },
];

const STATUS_LABELS: Record<string, string> = {
  backlog: "Бэклог",
  in_progress: "В работе",
  review: "Проверка",
  done: "Готово",
  fix: "Исправление",
  archived: "Архив",
  custom: "Другой этап",
};

const WORK_TYPE_LABELS: Record<string, string> = {
  feature: "Фичи",
  bug: "Баги",
};

const PRIORITY_VALUES = new Set<string>(
  TASK_PRIORITY_OPTIONS.map((priority) => priority.value),
);

function isAnalyticsObject(value: AnalyticsValue | undefined): value is AnalyticsObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTaskPriorityKey(value: string): value is TaskPriority {
  return PRIORITY_VALUES.has(value);
}

function formatNullableNumber(value: number | null | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(0)}%`;
}

function formatMetricValue(value: AnalyticsValue | undefined, format: MetricDefinition["format"]) {
  if (typeof value !== "number") {
    return "—";
  }

  if (format === "hours") {
    return formatNullableNumber(value, " ч");
  }

  if (format === "ratio") {
    return formatRatio(value);
  }

  if (format === "integer") {
    return Number.isInteger(value) ? value : value.toFixed(0);
  }

  return Number.isInteger(value) ? value : value.toFixed(2);
}

function formatPercentileCell(value: AnalyticsObject | null, percentile: string) {
  const percentileValue = value?.[percentile];
  return typeof percentileValue === "number"
    ? formatNullableNumber(percentileValue, " ч")
    : "—";
}

function toRatioPercent(value: number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  const percentage = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

function isTaskCompleted(task: Task): boolean {
  return Boolean(task.completed_at) || task.columnType === "done";
}

function isTaskOverdue(task: Task, now: number): boolean {
  if (!task.due_date || isTaskCompleted(task)) {
    return false;
  }

  const dueDate = new Date(task.due_date).getTime();
  return Number.isFinite(dueDate) && dueDate < now;
}

function objectToDistribution(value: AnalyticsValue | undefined): DistributionItem[] {
  if (!isAnalyticsObject(value)) {
    return [];
  }

  return Object.entries(value)
    .filter(([, itemValue]) => typeof itemValue === "number")
    .map(([key, itemValue]) => ({
      key,
      label: key,
      value: Number(itemValue),
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function translateDistributionItems(
  items: DistributionItem[],
  labels: Record<string, string>,
) {
  return items.map((item) => ({
    ...item,
    label: labels[item.key] ?? item.label,
  }));
}

function listToDistribution(
  value: AnalyticsValue | undefined,
  labelKey: string,
  valueKey: string,
): DistributionItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isAnalyticsObject)
    .map((item, index) => {
      const label = item[labelKey];
      const itemValue = item[valueKey];

      return {
        key: String(item.column_id ?? item.key ?? index),
        label: typeof label === "string" ? label : String(item.key ?? index + 1),
        value: typeof itemValue === "number" ? itemValue : 0,
      };
    })
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function HorizontalBars({ items, total }: { items: DistributionItem[]; total: number }) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-slate-600">
        Недостаточно данных для отображения.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

        return (
          <div className="metrics-bar-row" key={item.key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              {isTaskPriorityKey(item.key) ? (
                <PriorityBadge priority={item.key} />
              ) : (
                <span className="truncate font-medium text-slate-700">{item.label}</span>
              )}
              <span className="font-semibold text-slate-950">{item.value}</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-value"
                data-priority={isTaskPriorityKey(item.key) ? item.key : undefined}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MetricsPage({
  projects,
  boards,
  activeProject,
  activeBoard,
  columns,
  tasks,
  analyticsSummary,
  analyticsMetrics,
  analyticsMetaMetrics,
  analyticsError,
  isLoading,
  onRefreshMetrics,
}: MetricsPageProps) {
  useEffect(() => {
    if (!activeProject || !activeBoard) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void onRefreshMetrics();
    }, 45_000);

    return () => window.clearInterval(intervalId);
  }, [activeBoard, activeProject, onRefreshMetrics]);

  const now = Date.now();
  const completedOnBoard = useMemo(() => tasks.filter(isTaskCompleted).length, [tasks]);
  const boardCompletionRatio = tasks.length > 0 ? completedOnBoard / tasks.length : null;
  const overdueOnBoard = useMemo(
    () => tasks.filter((task) => isTaskOverdue(task, now)).length,
    [now, tasks],
  );
  const bugTasksOnBoard = useMemo(() => tasks.filter((task) => task.is_bug).length, [tasks]);
  const unassignedTasks = useMemo(
    () => tasks.filter((task) => task.assigned_to_id == null).length,
    [tasks],
  );
  const wipTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !isTaskCompleted(task) &&
          task.columnType !== "archived" &&
          task.columnType !== "backlog",
      ).length,
    [tasks],
  );
  const columnDistribution = useMemo<DistributionItem[]>(
    () =>
      columns.map((column) => ({
        key: String(column.id),
        label: `${column.name} · ${formatColumnType(column.column_type)}`,
        value: column.tasks.length,
      })),
    [columns],
  );
  const priorityDistribution = useMemo<DistributionItem[]>(() => {
    const apiPriorityMix = objectToDistribution(analyticsMetrics?.priority_mix);

    if (apiPriorityMix.length > 0) {
      return apiPriorityMix.map((item) => ({
        ...item,
        label:
          TASK_PRIORITY_OPTIONS.find((priority) => priority.value === item.key)?.label ??
          item.label,
      }));
    }

    return TASK_PRIORITY_OPTIONS.map((priority) => ({
      key: priority.value,
      label: priority.label,
      value: tasks.filter((task) => task.priority === priority.value).length,
    })).filter((item) => item.value > 0);
  }, [analyticsMetrics?.priority_mix, tasks]);

  const apiStatusDistribution = useMemo<DistributionItem[]>(
    () => {
      const items =
        objectToDistribution(analyticsMetrics?.status_counts).length > 0
          ? objectToDistribution(analyticsMetrics?.status_counts)
          : Object.entries(analyticsSummary?.total_by_status ?? {})
              .map(([status, value]) => ({
                key: status,
                label: status,
                value,
              }))
              .filter((item) => item.value > 0)
              .sort((left, right) => right.value - left.value);

      return translateDistributionItems(items, STATUS_LABELS);
    },
    [analyticsMetrics?.status_counts, analyticsSummary?.total_by_status],
  );
  const wipByColumnDistribution = useMemo<DistributionItem[]>(
    () =>
      listToDistribution(analyticsMetrics?.wip_by_column, "column_name", "count").length > 0
        ? listToDistribution(analyticsMetrics?.wip_by_column, "column_name", "count")
        : columnDistribution,
    [analyticsMetrics?.wip_by_column, columnDistribution],
  );
  const workTypeDistribution = useMemo<DistributionItem[]>(
    () => translateDistributionItems(objectToDistribution(analyticsMetrics?.work_type_mix), WORK_TYPE_LABELS),
    [analyticsMetrics?.work_type_mix],
  );
  const timeInStatusRows = useMemo(
    () =>
      Array.isArray(analyticsMetrics?.time_in_status_hours_avg)
        ? analyticsMetrics.time_in_status_hours_avg.filter(isAnalyticsObject)
        : [],
    [analyticsMetrics?.time_in_status_hours_avg],
  );
  const leadPercentiles = isAnalyticsObject(analyticsMetaMetrics?.lead_time_percentiles_hours)
    ? analyticsMetaMetrics.lead_time_percentiles_hours
    : null;
  const cyclePercentiles = isAnalyticsObject(analyticsMetaMetrics?.cycle_time_percentiles_hours)
    ? analyticsMetaMetrics.cycle_time_percentiles_hours
    : null;
  const queueDominance = isAnalyticsObject(analyticsMetaMetrics?.queue_dominance)
    ? analyticsMetaMetrics.queue_dominance
    : null;
  const percentileRows: Array<[string, AnalyticsObject | null]> = [
    ["От создания до закрытия", leadPercentiles],
    ["От начала работы до закрытия", cyclePercentiles],
  ];

  const hasBoardData = columns.length > 0 || tasks.length > 0;
  const hasApiData = analyticsSummary !== null || analyticsMetrics !== null || analyticsMetaMetrics !== null;
  const hasNoData = !hasBoardData && !hasApiData;

  if (!activeProject || !activeBoard) {
    return (
      <EmptyState
        description="Выберите проект и доску для просмотра метрик"
        title="Выберите проект и доску для просмотра метрик"
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Загрузка метрик…" />;
  }

  return (
    <div className="space-y-6">
      <section className="page-panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Метрики</h2>
            <p className="mt-1 text-sm text-slate-600">
              Показатели берутся из /analytics/summary, /analytics/metrics и /analytics/metametrics.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Проект: {activeProject.name} · Доска: {activeBoard.name}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
            Автообновление каждые 45 секунд
          </div>
        </div>
      </section>

      {analyticsError ? <ErrorNotice message="Не удалось загрузить метрики" /> : null}

      {hasNoData ? (
        <EmptyState
          description="Добавьте задачи или дождитесь ответа analytics API, чтобы увидеть показатели."
          title="Недостаточно данных для отображения"
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Всего задач" value={tasks.length} />
            <MetricCard label="Выполнено на доске" value={completedOnBoard} />
            <MetricCard label="Просрочено на доске" value={overdueOnBoard} />
            <MetricCard label="Багов на доске" value={bugTasksOnBoard} />
            <MetricCard label="Процент выполнения" value={formatRatio(boardCompletionRatio)} />
            <MetricCard
              label="Закрыто за период"
              value={analyticsSummary?.closed_in_period ?? "—"}
              description="/analytics/summary"
            />
            <MetricCard
              label="Среднее завершение"
              value={formatNullableNumber(analyticsSummary?.average_completion_time_hours, " ч")}
              description="/analytics/summary"
            />
            <MetricCard
              label="Среднее до старта"
              value={formatNullableNumber(analyticsSummary?.average_time_to_start_hours, " ч")}
              description="/analytics/summary"
            />
            <MetricCard
              label="Закрытие багов"
              value={formatNullableNumber(analyticsSummary?.average_bug_close_time_hours, " ч")}
              description="/analytics/summary"
            />
            <MetricCard label="Без исполнителя" value={unassignedTasks} />
          </section>

          <section>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Метрики API</h3>
              <p className="text-sm text-slate-600">
                Значения запрошены через /analytics/metrics с фильтрами текущего проекта и доски.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {API_METRIC_CARDS.map((metric) => (
                <MetricCard
                  description="/analytics/metrics"
                  key={metric.key}
                  label={metric.label}
                  value={formatMetricValue(analyticsMetrics?.[metric.key], metric.format)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Метаметрики API</h3>
              <p className="text-sm text-slate-600">
                Производные показатели запрошены через /analytics/metametrics.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {API_META_CARDS.map((metric) => (
                <MetricCard
                  description="/analytics/metametrics"
                  key={metric.key}
                  label={metric.label}
                  value={formatMetricValue(analyticsMetaMetrics?.[metric.key], metric.format)}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <article className="panel analytics-card p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Распределение по этапам</h3>
                  <p className="text-sm text-slate-600">
                    Данные активной доски из загруженных колонок и задач.
                  </p>
                </div>
                <span className="analytics-chip">{tasks.length} задач</span>
              </div>
              <HorizontalBars items={columnDistribution} total={tasks.length} />
            </article>

            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Выполнение доски</h3>
                <p className="text-sm text-slate-600">
                  Доля задач в готовых этапах или с completed_at.
                </p>
              </div>
              <div
                className="completion-card"
                style={
                  { "--stage-progress": `${toRatioPercent(boardCompletionRatio)}%` } as CSSProperties
                }
              >
                <div>
                  <span>Готовность</span>
                  <strong>{formatRatio(boardCompletionRatio)}</strong>
                </div>
                <div className="stage-meter" role="img" aria-label={`Готовность доски: ${toRatioPercent(boardCompletionRatio)}%`}>
                  <span className="stage-meter-fill" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Сейчас в работе</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{wipTasks}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Проектов / досок</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {projects.length} / {boards.length}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Задачи по статусам</h3>
                <p className="text-sm text-slate-600">Распределение status_counts из /analytics/metrics.</p>
              </div>
              <HorizontalBars
                items={apiStatusDistribution}
                total={apiStatusDistribution.reduce((sum, item) => sum + item.value, 0)}
              />
            </article>

            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Задачи в работе по колонкам</h3>
                <p className="text-sm text-slate-600">Активные задачи по колонкам из /analytics/metrics.</p>
              </div>
              <HorizontalBars
                items={wipByColumnDistribution}
                total={wipByColumnDistribution.reduce((sum, item) => sum + item.value, 0)}
              />
            </article>

            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Приоритеты задач</h3>
                <p className="text-sm text-slate-600">Поле priority_mix из /analytics/metrics.</p>
              </div>
              <HorizontalBars items={priorityDistribution} total={tasks.length} />
            </article>

            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Типы работ</h3>
                <p className="text-sm text-slate-600">Разрез фич и багов из /analytics/metrics.</p>
              </div>
              <HorizontalBars
                items={workTypeDistribution}
                total={workTypeDistribution.reduce((sum, item) => sum + item.value, 0)}
              />
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="panel p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-950">Время в статусе</h3>
                <p className="text-sm text-slate-600">
                  Среднее время по колонкам из time_in_status_hours_avg.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Этап</th>
                      <th>Тип</th>
                      <th>Среднее</th>
                      <th>Всего</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeInStatusRows.length > 0 ? (
                      timeInStatusRows.map((row, index) => (
                        <tr key={String(row.column_id ?? index)}>
                          <td>{String(row.column_name ?? "—")}</td>
                          <td>{String(row.column_type ?? "—")}</td>
                          <td>
                            {typeof row.average_hours === "number"
                              ? formatNullableNumber(row.average_hours, " ч")
                              : "—"}
                          </td>
                          <td>
                            {typeof row.total_hours === "number"
                              ? formatNullableNumber(row.total_hours, " ч")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Недостаточно данных</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-950">Перцентили</h3>
                <p className="text-sm text-slate-600">
                  P50/P75/P85/P95 по времени прохождения задач из /analytics/metametrics.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Метрика</th>
                      <th>P50</th>
                      <th>P75</th>
                      <th>P85</th>
                      <th>P95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {percentileRows.map(([label, value]) => (
                      <tr key={String(label)}>
                        <td>{String(label)}</td>
                        {["p50", "p75", "p85", "p95"].map((percentile) => (
                          <td key={percentile}>{formatPercentileCell(value, percentile)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">Узкое место:</span>{" "}
                {queueDominance
                  ? `${String(queueDominance.column_name ?? queueDominance.column_type ?? "—")} · ${
                      typeof queueDominance.average_hours === "number"
                        ? formatNullableNumber(queueDominance.average_hours, " ч")
                        : "—"
                    }`
                  : "Недостаточно данных"}
              </div>
            </article>
          </section>

          <section className="panel p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Задачи по этапам</h3>
              <p className="text-sm text-slate-600">
                Таблица строится только по задачам активной доски.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Этап</th>
                    <th>Тип</th>
                    <th>Задач</th>
                    <th>Багов</th>
                    <th>Просрочено</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column) => (
                    <tr key={column.id}>
                      <td>{column.name}</td>
                      <td>{formatColumnType(column.column_type)}</td>
                      <td>{column.tasks.length}</td>
                      <td>{column.tasks.filter((task) => task.is_bug).length}</td>
                      <td>{column.tasks.filter((task) => isTaskOverdue(task, now)).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
