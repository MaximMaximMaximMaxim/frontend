import { FormEvent, useState } from "react";
import type { BoardOut } from "../types/api";

interface BoardControlsProps {
  boards: BoardOut[];
  activeBoardId: number | null;
  isDisabled: boolean;
  onSelectBoard: (boardId: number) => void;
  onCreateBoard: (title: string, description: string) => void;
}

export function BoardControls({
  boards,
  activeBoardId,
  isDisabled,
  onSelectBoard,
  onCreateBoard,
}: BoardControlsProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onCreateBoard(title, description);
    setTitle("");
    setDescription("");
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="board">
            Активная доска
          </label>
          <select
            className="field max-w-lg"
            disabled={boards.length === 0 || isDisabled}
            id="board"
            value={activeBoardId ?? ""}
            onChange={(event) => onSelectBoard(Number(event.target.value))}
          >
            {boards.length === 0 ? (
              <option value="">Досок пока нет</option>
            ) : (
              boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title}
                </option>
              ))
            )}
          </select>
        </div>

        <form className="grid flex-1 gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="board-title">
              Новая доска
            </label>
            <input
              className="field"
              id="board-title"
              maxLength={200}
              placeholder="Название доски"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="board-description">
              Описание
            </label>
            <input
              className="field"
              id="board-description"
              placeholder="Необязательно"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <button className="btn-primary self-end" disabled={isDisabled || !title.trim()} type="submit">
            Создать
          </button>
        </form>
      </div>
    </section>
  );
}
