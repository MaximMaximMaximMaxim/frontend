import { FormEvent, useState } from "react";
import { COLUMN_TYPE_OPTIONS } from "../api/adapters";
import type { ColumnType } from "../types/api";

interface ColumnFormProps {
  isDisabled: boolean;
  onCreateColumn: (name: string, columnType: ColumnType) => void;
}

export function ColumnForm({ isDisabled, onCreateColumn }: ColumnFormProps) {
  const [name, setName] = useState("");
  const [columnType, setColumnType] = useState<ColumnType>("custom");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onCreateColumn(name, columnType);
    setName("");
    setColumnType("custom");
  }

  return (
    <form className="grid gap-2 sm:grid-cols-[minmax(10rem,0.9fr)_minmax(11rem,1.1fr)_auto] sm:items-end" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="column-name">
          Новый этап
        </label>
        <input
          className="field"
          disabled={isDisabled}
          id="column-name"
          maxLength={200}
          placeholder="Например: В работе"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="column-type">
          Тип этапа
        </label>
        <select
          className="field"
          disabled={isDisabled}
          id="column-type"
          value={columnType}
          onChange={(event) => setColumnType(event.target.value as ColumnType)}
        >
          {COLUMN_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button className="btn-secondary" disabled={isDisabled || !name.trim()} type="submit">
        Добавить этап
      </button>
    </form>
  );
}
