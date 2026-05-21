import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ColumnWithTasks } from "../api/adapters";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { UnavailableBlock } from "../components/UnavailableBlock";
import type { AnalyticsSummary, BoardRead, ProjectRead } from "../types/api";
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

function truncateChartLabel(label: string): string {
  return label.length > 18 ? `${label.slice(0, 17)}...` : label;
}

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
  const columnDistribution = columns.map((column) => ({
    name: column.name,
    tasks: column.tasks.length,
  }));
  const statusDistribution = Object.entries(analyticsSummary?.total_by_status ?? {}).map(
    ([status, total]) => ({
      status,
      total,
    }),
  );
  const actualTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Дашборд</h2>
            <p className="mt-1 text-sm text-slate-600">
              {activeProject ? `Проект: ${activeProject.name}` : "Проект не выбран"}
              {activeBoard ? ` · Доска: ${activeBoard.name}` : ""}
            </p>
          </div>
          <p className="text-sm text-slate-500">API health: {healthStatus ?? "не проверен"}</p>
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
        <MetricCard label="Completion ratio" value={formatRatio(analyticsSummary?.completion_ratio)} />
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

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel min-w-0 overflow-hidden p-5">
          <h3 className="text-lg font-semibold text-slate-950">Задачи по этапам</h3>
          {columnDistribution.length > 0 ? (
            <div className="mt-5 h-72 min-w-0 overflow-hidden">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={columnDistribution} margin={{ left: 0, right: 12, top: 12 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    tickFormatter={truncateChartLabel}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                    }}
                    cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
                  />
                  <Bar dataKey="tasks" fill="#0f766e" name="Задач" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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

        <div className="panel min-w-0 overflow-hidden p-5">
          <h3 className="text-lg font-semibold text-slate-950">Статусы из аналитики API</h3>
          {statusDistribution.length > 0 ? (
            <div className="mt-5 h-72 min-w-0 overflow-hidden">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={statusDistribution} margin={{ left: 0, right: 12, top: 12 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="status"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    tickFormatter={truncateChartLabel}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                    }}
                    cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
                  />
                  <Bar dataKey="total" fill="#1d4ed8" name="Задач" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                description="Analytics summary пока не вернул распределение по статусам."
                title="Недостаточно данных"
              />
            </div>
          )}
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

      <section className="grid gap-4 md:grid-cols-3">
        <UnavailableBlock title="Отделы и сотрудники" />
        <UnavailableBlock title="Комментарии и история" />
        <UnavailableBlock
          title="ИИ-аналитика"
          description="ИИ-аналитика недоступна: в текущей OpenAPI-спецификации отсутствует endpoint для AI-аналитики."
        />
      </section>
    </div>
  );
}
