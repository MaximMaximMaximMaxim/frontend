import { FormEvent, useState } from "react";
import type { BoardRead, ProjectRead } from "../types/api";

interface BoardControlsProps {
  projects: ProjectRead[];
  activeProjectId: number | null;
  boards: BoardRead[];
  activeBoardId: number | null;
  isDisabled: boolean;
  onSelectProject: (projectId: number) => void;
  onCreateProject: (name: string, description: string) => void;
  onSelectBoard: (boardId: number) => void;
  onCreateBoard: (name: string) => void;
}

export function BoardControls({
  projects,
  activeProjectId,
  boards,
  activeBoardId,
  isDisabled,
  onSelectProject,
  onCreateProject,
  onSelectBoard,
  onCreateBoard,
}: BoardControlsProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [boardName, setBoardName] = useState("");

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectName.trim()) {
      return;
    }

    onCreateProject(projectName, projectDescription);
    setProjectName("");
    setProjectDescription("");
  }

  function handleCreateBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!boardName.trim()) {
      return;
    }

    onCreateBoard(boardName);
    setBoardName("");
  }

  return (
    <section className="panel p-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="project">
              Активный проект
            </label>
            <select
              className="field"
              disabled={projects.length === 0 || isDisabled}
              id="project"
              value={activeProjectId ?? ""}
              onChange={(event) => onSelectProject(Number(event.target.value))}
            >
              {projects.length === 0 ? (
                <option value="">Проектов пока нет</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateProject}>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-800"
                htmlFor="project-name"
              >
                Новый проект
              </label>
              <input
                className="field"
                disabled={isDisabled}
                id="project-name"
                maxLength={200}
                placeholder="Название проекта"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-800"
                htmlFor="project-description"
              >
                Описание
              </label>
              <input
                className="field"
                disabled={isDisabled}
                id="project-description"
                placeholder="Необязательно"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
              />
            </div>
            <button
              className="btn-primary self-end"
              disabled={isDisabled || !projectName.trim()}
              type="submit"
            >
              Создать
            </button>
          </form>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="board">
              Активная доска
            </label>
            <select
              className="field"
              disabled={boards.length === 0 || isDisabled || !activeProjectId}
              id="board"
              value={activeBoardId ?? ""}
              onChange={(event) => onSelectBoard(Number(event.target.value))}
            >
              {boards.length === 0 ? (
                <option value="">Досок пока нет</option>
              ) : (
                boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleCreateBoard}>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-800"
                htmlFor="board-name"
              >
                Новая доска
              </label>
              <input
                className="field"
                disabled={isDisabled || !activeProjectId}
                id="board-name"
                maxLength={200}
                placeholder="Название доски"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
              />
            </div>
            <button
              className="btn-primary self-end"
              disabled={isDisabled || !activeProjectId || !boardName.trim()}
              type="submit"
            >
              Создать
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
