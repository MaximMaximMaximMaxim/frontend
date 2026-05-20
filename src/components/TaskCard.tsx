import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{task.title}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">
            {task.columnTitle}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">Позиция: {task.position ?? 0}</span>
        <div className="flex gap-2">
          <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => onEdit(task)}>
            Редактировать
          </button>
          <button className="btn-danger px-3 py-1.5" type="button" onClick={() => onDelete(task.id)}>
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}
