import { PriorityBadge } from "./PriorityBadge";
import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ru-RU");
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  return (
    <article className="task-list-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{task.title}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">
            {task.columnName}
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          #{task.id}
        </span>
      </div>

      {task.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-400">Описание не заполнено</p>
      )}

      <dl className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Приоритет</dt>
          <dd className="mt-1">
            <PriorityBadge priority={task.priority} />
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Срок</dt>
          <dd>{formatDate(task.due_date)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Оценка</dt>
          <dd>{task.estimate ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">ID исполнителя</dt>
          <dd>{task.assigned_to_id ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end">
        <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => onEdit(task)}>
          Редактировать
        </button>
      </div>
    </article>
  );
}
