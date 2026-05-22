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
  const dataStatus = analyticsSummary ? "Сводка обновлена" : "Сводка пока недоступна";

  return (
    <div className="space-y-6">
      <section className="page-panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Дашборд</h2>
            <p className="mt-1 text-sm text-slate-600">
              Краткий обзор: что происходит в целом.
            </p>
            <div className="page-context-chips" aria-label="Контекст страницы">
              <span className="page-context-chip">
                {activeProject ? activeProject.name : "Проект не выбран"}
              </span>
              {activeBoard ? <span className="page-context-chip">{activeBoard.name}</span> : null}
            </div>
          </div>

          <div
            className={
              isHealthOk
                ? "status-pill status-pill--ok"
                : "status-pill status-pill--risk"
            }
          >
            {isHealthOk ? "Система работает" : "Система проверяется"}
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
        <MetricCard label="Выполнено задач" value={analyticsSummary?.completed_tasks ?? "—"} />
        <MetricCard label="Просрочено задач" value={analyticsSummary?.overdue_tasks ?? "—"} />
        <MetricCard label="Доля выполнения" value={formatRatio(analyticsSummary?.completion_ratio)} />
        <MetricCard
          label="Задачи в исправлении"
          value={analyticsSummary?.bug_tasks ?? "—"}
          description="Колонка типа fix"
        />
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
                ИИ-ассистент помогает быстро разобрать риски, задачи в работе,
                закрытые задачи за период, сроки и качество потока. Откройте плавающую
                кнопку справа, чтобы задать вопрос по текущему проекту.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
