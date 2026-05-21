import { useEffect, useMemo, type CSSProperties } from "react";
import { formatColumnType, TASK_PRIORITY_OPTIONS, type ColumnWithTasks } from "../api/adapters";
import { EmptyState } from "../components/EmptyState";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import type { AnalyticsSummary, BoardRead, ProjectRead } from "../types/api";
import type { Task } from "../types/task";

interface MetricsPageProps {
  projects: ProjectRead[];
  boards: BoardRead[];
  activeProject: ProjectRead | null;
  activeBoard: BoardRead | null;
  columns: ColumnWithTasks[];
  tasks: Task[];
  analyticsSummary: AnalyticsSummary | null;
  analyticsError: string | null;
  isLoading: boolean;
  onRefreshMetrics: () => Promise<AnalyticsSummary | null>;
}

interface DistributionItem {
  key: string;
  label: string;
  value: number;
}

const FUTURE_METRICS = [
  "Lead Time",
  "Cycle Time",
  "Time in Status",
  "Flow Efficiency",
  "SLA Compliance",
  "Rework Rate",
  "Predictability Score",
  "Forecast metrics",
  "Portfolio metrics",
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
              <span className="truncate font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-950">{item.value}</span>
            </div>
            <div className="progress-track">
              <div className="progress-value" style={{ width: `${percent}%` }} />
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
  const priorityDistribution = useMemo<DistributionItem[]>(
    () =>
      TASK_PRIORITY_OPTIONS.map((priority) => ({
        key: priority.value,
        label: priority.label,
        value: tasks.filter((task) => task.priority === priority.value).length,
      })).filter((item) => item.value > 0),
    [tasks],
  );
  const apiStatusDistribution = useMemo<DistributionItem[]>(
    () =>
      Object.entries(analyticsSummary?.total_by_status ?? {})
        .map(([status, value]) => ({
          key: status,
          label: status,
          value,
        }))
        .sort((left, right) => right.value - left.value),
    [analyticsSummary?.total_by_status],
  );
  const hasBoardData = columns.length > 0 || tasks.length > 0;
  const hasApiData = analyticsSummary !== null;
  const hasNoData = !hasBoardData && !hasApiData;
  const isPartialData = !hasBoardData || !hasApiData;

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
              Метрики строятся по данным текущего проекта и доски.
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

      {isPartialData && !hasNoData ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Часть показателей доступна не полностью: данные активной доски считаются из задач и колонок,
          а временные показатели берутся из GET /analytics/summary без project/board-фильтров,
          потому что текущая OpenAPI-спецификация их не описывает.
        </section>
      ) : null}

      {hasNoData ? (
        <EmptyState
          description="Добавьте задачи и дождитесь доступной сводки API, чтобы увидеть расширенные показатели."
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
              description="GET /analytics/summary"
            />
            <MetricCard
              label="Среднее завершение"
              value={formatNullableNumber(analyticsSummary?.average_completion_time_hours, " ч")}
              description={
                analyticsSummary?.average_completion_time_hours == null
                  ? "Недостаточно данных"
                  : "GET /analytics/summary"
              }
            />
            <MetricCard
              label="Среднее до старта"
              value={formatNullableNumber(analyticsSummary?.average_time_to_start_hours, " ч")}
              description={
                analyticsSummary?.average_time_to_start_hours == null
                  ? "Недостаточно данных"
                  : "GET /analytics/summary"
              }
            />
            <MetricCard
              label="Закрытие багов"
              value={formatNullableNumber(analyticsSummary?.average_bug_close_time_hours, " ч")}
              description={
                analyticsSummary?.average_bug_close_time_hours == null
                  ? "Недостаточно данных"
                  : "GET /analytics/summary"
              }
            />
            <MetricCard label="Без исполнителя" value={unassignedTasks} />
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
                  <span>Completion ratio</span>
                  <strong>{formatRatio(boardCompletionRatio)}</strong>
                </div>
                <div className="stage-meter" role="img" aria-label={`Готовность доски: ${toRatioPercent(boardCompletionRatio)}%`}>
                  <span className="stage-meter-fill" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">WIP</p>
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
                <h3 className="text-lg font-semibold text-slate-950">Total by status</h3>
                <p className="text-sm text-slate-600">
                  Представление поля total_by_status из GET /analytics/summary.
                </p>
              </div>
              <HorizontalBars
                items={apiStatusDistribution}
                total={apiStatusDistribution.reduce((sum, item) => sum + item.value, 0)}
              />
            </article>

            <article className="panel analytics-card p-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Приоритеты задач</h3>
                <p className="text-sm text-slate-600">
                  Честный разрез по полю task.priority.
                </p>
              </div>
              <HorizontalBars items={priorityDistribution} total={tasks.length} />
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

      <section className="panel p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-950">
            Метрики, требующие дополнительных данных
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Недоступно: для расчёта нужны история статусов, даты переходов или дополнительные
            поля, которых нет в текущем API.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {FUTURE_METRICS.map((metric) => (
            <article className="future-metric-card" key={metric} aria-disabled="true">
              <span>{metric}</span>
              <p>Будущая возможность</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
