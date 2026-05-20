import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { UnavailableBlock } from "../components/UnavailableBlock";
import type { BoardDetail, BoardOut } from "../types/api";
import type { Task } from "../types/task";

interface DashboardPageProps {
  boards: BoardOut[];
  activeBoard: BoardDetail | null;
  tasks: Task[];
  healthStatus: string | null;
}

function truncateChartLabel(label: string): string {
  return label.length > 18 ? `${label.slice(0, 17)}...` : label;
}

export function DashboardPage({ boards, activeBoard, tasks, healthStatus }: DashboardPageProps) {
  const columns = activeBoard?.columns ?? [];
  const distribution = columns.map((column) => ({
    name: column.title,
    cards: column.cards.length,
  }));
  const mostFilledColumn = columns.reduce(
    (currentMax, column) =>
      column.cards.length > (currentMax?.cards.length ?? -1) ? column : currentMax,
    columns[0] ?? null,
  );
  const actualTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Дашборд</h2>
          </div>
          <p className="text-sm text-slate-500">API health: {healthStatus ?? "не проверен"}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Досок" value={boards.length} />
          <MetricCard label="Этапов на доске" value={columns.length} />
          <MetricCard label="Карточек на доске" value={tasks.length} />
          <MetricCard
            label="Самая заполненная колонка"
            value={mostFilledColumn ? mostFilledColumn.title : "Нет данных"}
            description={
              mostFilledColumn ? `Карточек: ${mostFilledColumn.cards.length}` : undefined
            }
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel min-w-0 overflow-hidden p-5">
          <h3 className="text-lg font-semibold text-slate-950">Распределение карточек по этапам</h3>
          {distribution.length > 0 ? (
            <div className="mt-5 h-72 min-w-0 overflow-hidden">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={distribution} margin={{ left: 0, right: 12, top: 12 }}>
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
                  <Bar dataKey="cards" fill="#0f766e" name="Карточек" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                description="Добавьте этапы и карточки на выбранной доске, чтобы увидеть распределение."
                title="Нет данных для графика"
              />
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-slate-950">Актуальные карточки</h3>
          {actualTasks.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {actualTasks.map((task) => (
                <li className="rounded-md border border-slate-200 p-3" key={task.id}>
                  <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.columnTitle}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              На выбранной доске пока нет карточек.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <UnavailableBlock title="Отделы, сроки и просрочки" />
        <UnavailableBlock title="Приоритеты и загрузка сотрудников" />
        <UnavailableBlock title="ИИ-аналитика" />
      </section>
    </div>
  );
}
