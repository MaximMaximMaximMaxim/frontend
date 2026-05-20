import { FormEvent, useState } from "react";

interface ColumnFormProps {
  isDisabled: boolean;
  onCreateColumn: (title: string) => void;
}

export function ColumnForm({ isDisabled, onCreateColumn }: ColumnFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onCreateColumn(title);
    setTitle("");
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
      <div className="flex-1">
        <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="column-title">
          Новый этап
        </label>
        <input
          className="field"
          id="column-title"
          maxLength={200}
          placeholder="Например: В работе"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <button className="btn-secondary" disabled={isDisabled || !title.trim()} type="submit">
        Добавить этап
      </button>
    </form>
  );
}
