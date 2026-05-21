import { MetricCard } from "../components/MetricCard";
import type { ColumnWithTasks } from "../api/adapters";
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
  const isHealthOk = healthStatus === "ok";
  const dataStatus = analyticsSummary ? "Сводка API загружена" : "Сводка API недоступна";

  return (
    <div className="space-y-6">
      <section className="page-panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Дашборд</h2>
            <p className="mt-1 text-sm text-slate-600">
              Краткий обзор: что происходит в целом.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {activeProject ? `Проект: ${activeProject.name}` : "Проект не выбран"}
              {activeBoard ? ` · Доска: ${activeBoard.name}` : ""}
            </p>
          </div>

          <div
            className={
              isHealthOk
                ? "status-pill status-pill--ok"
                : "status-pill status-pill--risk"
            }
          >
            API health: {healthStatus ?? "не проверен"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Проектов" value={projects.length} />
        <MetricCard label="Досок в проекте" value={boards.length} />
        <MetricCard label="Колонок" value={columns.length} />
        <MetricCard label="Задач на доске" value={tasks.length} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed tasks" value={analyticsSummary?.completed_tasks ?? "—"} />
        <MetricCard label="Overdue tasks" value={analyticsSummary?.overdue_tasks ?? "—"} />
        <MetricCard label="Completion ratio" value={formatRatio(analyticsSummary?.completion_ratio)} />
        <MetricCard label="Bug tasks" value={analyticsSummary?.bug_tasks ?? "—"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <h3 className="text-lg font-semibold text-slate-950">Статус данных</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p>{dataStatus}</p>
            <p>
              Dashboard показывает только базовую сводку. Детальные разрезы по проекту,
              доске, этапам и задачам вынесены в раздел «Метрики».
            </p>
          </div>
        </article>

        <article className="panel p-5">
          <div className="flex items-start gap-4">
            <div className="ai-inline-avatar" aria-hidden="true">
              AI
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">ИИ-ассистент</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                ИИ-ассистент пока недоступен: в текущей OpenAPI-спецификации отсутствует
                endpoint для AI-аналитики.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
