import { FormEvent, useEffect, useState } from "react";
import {
  formatDateTimeLocal,
  TASK_PRIORITY_OPTIONS,
  type ColumnWithTasks,
} from "../api/adapters";
import type { TaskPriority } from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

interface TaskFormProps {
  columns: ColumnWithTasks[];
  editingTask: Task | null;
  isDisabled: boolean;
  onCancelEdit: () => void;
  onSaveTask: (values: TaskFormValues) => void;
}

function getInitialColumnId(columns: ColumnWithTasks[], editingTask: Task | null): number {
  return editingTask?.column_id ?? columns[0]?.id ?? 0;
}

export function TaskForm({
  columns,
  editingTask,
  isDisabled,
  onCancelEdit,
  onSaveTask,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [estimate, setEstimate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [columnId, setColumnId] = useState(0);

  useEffect(() => {
    setTitle(editingTask?.title ?? "");
    setDescription(editingTask?.description ?? "");
    setPriority(editingTask?.priority ?? "medium");
    setEstimate(editingTask?.estimate == null ? "" : String(editingTask.estimate));
    setDueDate(formatDateTimeLocal(editingTask?.due_date));
    setAssignedToId(
      editingTask?.assigned_to_id == null ? "" : String(editingTask.assigned_to_id),
    );
    setColumnId(getInitialColumnId(columns, editingTask));
  }, [columns, editingTask]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !columnId) {
      return;
    }

    onSaveTask({
      id: editingTask?.id,
      title,
      description,
      priority,
      estimate,
      dueDate,
      assignedToId,
      columnId,
    });

    if (!editingTask) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setEstimate("");
      setDueDate("");
      setAssignedToId("");
      setColumnId(columns[0]?.id ?? 0);
    }
  }

  const hasColumns = columns.length > 0;

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {editingTask ? "Редактирование задачи" : "Новая задача"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Поля соответствуют текущей OpenAPI-схеме задачи.
          </p>
        </div>
        {editingTask ? (
          <button className="btn-secondary" type="button" onClick={onCancelEdit}>
            Отменить
          </button>
        ) : null}
      </div>

      {!hasColumns ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Чтобы создать задачу, сначала добавьте этап на выбранной доске.
        </p>
      ) : null}

      <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-title">
            Название
          </label>
          <input
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-title"
            maxLength={200}
            placeholder="Название задачи"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-column">
            Этап
          </label>
          <select
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-column"
            value={columnId}
            onChange={(event) => setColumnId(Number(event.target.value))}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-priority">
            Приоритет
          </label>
          <select
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-estimate">
            Оценка
          </label>
          <input
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-estimate"
            min={0}
            placeholder="Число"
            type="number"
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-due-date">
            Срок
          </label>
          <input
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="task-assigned-to"
          >
            ID исполнителя
          </label>
          <input
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-assigned-to"
            min={1}
            placeholder="Числовой ID, если известен"
            type="number"
            value={assignedToId}
            onChange={(event) => setAssignedToId(event.target.value)}
          />
        </div>

        <div className="lg:col-span-2">
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="task-description"
          >
            Описание
          </label>
          <textarea
            className="field min-h-28"
            disabled={!hasColumns || isDisabled}
            id="task-description"
            placeholder="Необязательно"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="lg:col-span-2">
          <button
            className="btn-primary w-full"
            disabled={!hasColumns || isDisabled || !title.trim()}
            type="submit"
          >
            {editingTask ? "Сохранить задачу" : "Создать задачу"}
          </button>
        </div>
      </form>
    </section>
  );
}
