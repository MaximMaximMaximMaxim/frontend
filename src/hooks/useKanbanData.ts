import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildColumnsWithTasks,
  buildTaskCreatePayload,
  buildTaskUpdatePayload,
  flattenColumnTasks,
} from "../api/adapters";
import { getAnalyticsSummary } from "../api/analytics";
import { createBoard, listBoards } from "../api/boards";
import { createColumn, listColumns } from "../api/columns";
import { getHealth } from "../api/health";
import { createProject, listProjects } from "../api/projects";
import { createTask, listTasks, moveTask, updateTask } from "../api/tasks";
import type {
  AnalyticsSummary,
  BoardRead,
  ColumnRead,
  ColumnType,
  ProjectRead,
  TaskRead,
} from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось связаться с API. Проверьте подключение и попробуйте ещё раз.";
}

function pickProjectId(projects: ProjectRead[], currentId: number | null, preferredId?: number) {
  if (preferredId && projects.some((project) => project.id === preferredId)) {
    return preferredId;
  }

  if (currentId && projects.some((project) => project.id === currentId)) {
    return currentId;
  }

  return projects[0]?.id ?? null;
}

function pickBoardId(boards: BoardRead[], currentId: number | null, preferredId?: number) {
  if (preferredId && boards.some((board) => board.id === preferredId)) {
    return preferredId;
  }

  if (currentId && boards.some((board) => board.id === currentId)) {
    return currentId;
  }

  return boards.find((board) => board.is_default)?.id ?? boards[0]?.id ?? null;
}

interface MutationOptions {
  errorMessage?: string;
}

export function useKanbanData() {
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardRead[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [columns, setColumns] = useState<ColumnRead[]>([]);
  const [projectTasks, setProjectTasks] = useState<TaskRead[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const refreshWorkspace = useCallback(async (preferredProjectId?: number) => {
    setError(null);
    setIsLoading(true);

    try {
      const [loadedProjects, health, summary] = await Promise.all([
        listProjects(),
        getHealth(),
        getAnalyticsSummary(),
      ]);

      setProjects(loadedProjects);
      setHealthStatus(health.status ?? "ok");
      setAnalyticsSummary(summary);

      if (loadedProjects.length === 0) {
        setActiveProjectId(null);
        setBoards([]);
        setActiveBoardId(null);
        setColumns([]);
        setProjectTasks([]);
        return;
      }

      setActiveProjectId((currentProjectId) =>
        pickProjectId(loadedProjects, currentProjectId, preferredProjectId),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProjectData = useCallback(
    async (projectId: number, preferredBoardId?: number) => {
      setIsBoardLoading(true);
      setError(null);

      try {
        const [loadedBoards, loadedTasks] = await Promise.all([
          listBoards(projectId),
          listTasks(projectId),
        ]);

        setBoards(loadedBoards);
        setProjectTasks(loadedTasks);

        if (loadedBoards.length === 0) {
          setActiveBoardId(null);
          setColumns([]);
          return;
        }

        setActiveBoardId((currentBoardId) =>
          pickBoardId(loadedBoards, currentBoardId, preferredBoardId),
        );
      } catch (caughtError) {
        setBoards([]);
        setActiveBoardId(null);
        setColumns([]);
        setProjectTasks([]);
        setError(getErrorMessage(caughtError));
      } finally {
        setIsBoardLoading(false);
      }
    },
    [],
  );

  const refreshColumns = useCallback(async (boardId: number) => {
    setIsBoardLoading(true);
    setError(null);

    try {
      const loadedColumns = await listColumns(boardId);
      setColumns(loadedColumns);
    } catch (caughtError) {
      setColumns([]);
      setError(getErrorMessage(caughtError));
    } finally {
      setIsBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    if (activeProjectId) {
      void refreshProjectData(activeProjectId);
    }
  }, [activeProjectId, refreshProjectData]);

  useEffect(() => {
    if (activeBoardId) {
      void refreshColumns(activeBoardId);
    } else {
      setColumns([]);
    }
  }, [activeBoardId, refreshColumns]);

  const runMutation = useCallback(
    async (mutation: () => Promise<void>, options: MutationOptions = {}) => {
      setOperationError(null);
      setIsMutating(true);

      try {
        await mutation();
      } catch (caughtError) {
        setOperationError(options.errorMessage ?? getErrorMessage(caughtError));
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const handleCreateProject = useCallback(
    (name: string, description: string) =>
      runMutation(async () => {
        const project = await createProject({
          name: name.trim(),
          description: description.trim() || null,
        });

        await refreshWorkspace(project.id);
      }),
    [refreshWorkspace, runMutation],
  );

  const handleSelectProject = useCallback((projectId: number) => {
    setActiveProjectId(projectId);
    setActiveBoardId(null);
    setBoards([]);
    setColumns([]);
    setProjectTasks([]);
    setOperationError(null);
  }, []);

  const handleCreateBoard = useCallback(
    (name: string) =>
      runMutation(async () => {
        if (!activeProjectId) {
          throw new Error("Сначала выберите или создайте проект.");
        }

        const board = await createBoard({
          project_id: activeProjectId,
          name: name.trim(),
          is_default: false,
        });

        await refreshProjectData(activeProjectId, board.id);
      }),
    [activeProjectId, refreshProjectData, runMutation],
  );

  const handleSelectBoard = useCallback((boardId: number) => {
    setActiveBoardId(boardId);
    setColumns([]);
    setOperationError(null);
  }, []);

  const handleCreateColumn = useCallback(
    (name: string, columnType: ColumnType = "custom") =>
      runMutation(async () => {
        if (!activeBoardId) {
          throw new Error("Сначала выберите или создайте доску.");
        }

        const nextPosition =
          columns.length > 0
            ? Math.max(...columns.map((column) => column.position)) + 1
            : 0;

        await createColumn(activeBoardId, {
          name: name.trim(),
          position: nextPosition,
          column_type: columnType,
        });
        await refreshColumns(activeBoardId);
      }),
    [activeBoardId, columns, refreshColumns, runMutation],
  );

  const handleSaveTask = useCallback(
    (values: TaskFormValues) =>
      runMutation(async () => {
        if (!activeProjectId) {
          throw new Error("Сначала выберите или создайте проект.");
        }

        if (values.id) {
          await updateTask(values.id, buildTaskUpdatePayload(values));
        } else {
          await createTask(buildTaskCreatePayload(values, activeProjectId));
        }

        await refreshProjectData(activeProjectId, activeBoardId ?? undefined);
      }),
    [activeBoardId, activeProjectId, refreshProjectData, runMutation],
  );

  const handleMoveTask = useCallback(
    (task: Task, columnId: number) =>
      runMutation(async () => {
        if (!activeProjectId) {
          throw new Error("Сначала выберите или создайте проект.");
        }

        await moveTask(task.id, { column_id: columnId });
        await refreshProjectData(activeProjectId, activeBoardId ?? undefined);
      }, {
        errorMessage: "Не удалось переместить задачу. Попробуйте ещё раз.",
      }),
    [activeBoardId, activeProjectId, refreshProjectData, runMutation],
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );
  const activeBoard = useMemo(
    () => boards.find((board) => board.id === activeBoardId) ?? null,
    [activeBoardId, boards],
  );
  const activeBoardTasks = useMemo(() => {
    if (!activeBoardId) {
      return [];
    }

    const columnIds = new Set(columns.map((column) => column.id));

    return projectTasks.filter((task) => {
      const runtimeBoardId = (task as Partial<TaskRead>).board_id;
      return runtimeBoardId === activeBoardId || (runtimeBoardId == null && columnIds.has(task.column_id));
    });
  }, [activeBoardId, columns, projectTasks]);
  const columnsWithTasks = useMemo(
    () => buildColumnsWithTasks(columns, activeBoardTasks),
    [activeBoardTasks, columns],
  );
  const tasks = useMemo(() => flattenColumnTasks(columnsWithTasks), [columnsWithTasks]);

  return {
    projects,
    activeProject,
    activeProjectId,
    boards,
    activeBoard,
    activeBoardId,
    columns: columnsWithTasks,
    tasks,
    analyticsSummary,
    healthStatus,
    isLoading,
    isBoardLoading,
    isMutating,
    error,
    operationError,
    clearOperationError: () => setOperationError(null),
    refreshWorkspace,
    refreshProjectData,
    refreshColumns,
    createProject: handleCreateProject,
    selectProject: handleSelectProject,
    createBoard: handleCreateBoard,
    selectBoard: handleSelectBoard,
    createColumn: handleCreateColumn,
    saveTask: handleSaveTask,
    moveTask: handleMoveTask,
  };
}
