import { useMemo, useState } from "react";
import type { ColumnWithTasks } from "../api/adapters";
import { EmptyState } from "../components/EmptyState";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import type { BoardRead } from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

interface TasksPageProps {
  activeBoard: BoardRead | null;
  columns: ColumnWithTasks[];
  tasks: Task[];
  isMutating: boolean;
  onSaveTask: (values: TaskFormValues) => void;
}

export function TasksPage({
  activeBoard,
  columns,
  tasks,
  isMutating,
  onSaveTask,
}: TasksPageProps) {
  const [query, setQuery] = useState("");
  const [columnFilter, setColumnFilter] = useState("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLocaleLowerCase("ru-RU").includes(normalizedQuery) ||
        (task.description ?? "").toLocaleLowerCase("ru-RU").includes(normalizedQuery);
      const matchesColumn =
        columnFilter === "all" ? true : task.column_id === Number(columnFilter);

      return matchesQuery && matchesColumn;
    });
  }, [columnFilter, query, tasks]);

  if (!activeBoard) {
    return (
      <EmptyState
        description="Создайте или выберите доску, чтобы работать со списком задач."
        title="Доска не выбрана"
      />
    );
  }

  return (
    <div className="space-y-6">
      <TaskForm
        columns={columns}
        editingTask={editingTask}
        isDisabled={isMutating}
        onCancelEdit={() => setEditingTask(null)}
        onSaveTask={(values) => {
          onSaveTask(values);
          setEditingTask(null);
        }}
      />

      <section className="panel p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Список задач</h2>
            <p className="mt-1 text-sm text-slate-600">
              Поиск работает по реальным полям задачи: название и описание.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="search">
                Поиск
              </label>
              <input
                className="field"
                id="search"
                placeholder="Название или описание"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="stage">
                Этап
              </label>
              <select
                className="field"
                id="stage"
                value={columnFilter}
                onChange={(event) => setColumnFilter(event.target.value)}
              >
                <option value="all">Все этапы</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setEditingTask} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Задач по текущим условиям нет. Измените поиск или создайте задачу."
            title="Задачи не найдены"
          />
        )}
      </section>
    </div>
  );
}
