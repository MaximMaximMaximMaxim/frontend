import { FormEvent, useEffect, useState } from "react";
import type { ColumnWithCards } from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

interface TaskFormProps {
  columns: ColumnWithCards[];
  editingTask: Task | null;
  isDisabled: boolean;
  onCancelEdit: () => void;
  onSaveTask: (values: TaskFormValues) => void;
}

function getInitialColumnId(columns: ColumnWithCards[], editingTask: Task | null): number {
  return editingTask?.columnId ?? columns[0]?.id ?? 0;
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
  const [position, setPosition] = useState(0);
  const [columnId, setColumnId] = useState(0);

  useEffect(() => {
    setTitle(editingTask?.title ?? "");
    setDescription(editingTask?.description ?? "");
    setPosition(editingTask?.position ?? 0);
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
      position,
      columnId,
    });

    if (!editingTask) {
      setTitle("");
      setDescription("");
      setPosition(0);
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
            Поля соответствуют текущей OpenAPI-схеме карточки.
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

      <form className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]" onSubmit={handleSubmit}>
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
                {column.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-description">
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

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="task-position">
            Позиция
          </label>
          <input
            className="field"
            disabled={!hasColumns || isDisabled}
            id="task-position"
            min={0}
            type="number"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
          />
          <button
            className="btn-primary mt-4 w-full"
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
