import { useCallback, useEffect, useMemo, useState } from "react";
import { flattenBoardTasks, mapTaskToApiPayload } from "../api/adapters";
import { createBoard, getBoard, listBoards } from "../api/boards";
import { createCard, deleteCard, updateCard } from "../api/cards";
import { createColumn } from "../api/columns";
import { getHealth } from "../api/health";
import type { BoardDetail, BoardOut, CardCreate, CardUpdate } from "../types/api";
import type { Task, TaskFormValues } from "../types/task";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось связаться с API. Проверьте подключение и попробуйте ещё раз.";
}

export function useKanbanData() {
  const [boards, setBoards] = useState<BoardOut[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(null);
  const [activeBoard, setActiveBoard] = useState<BoardDetail | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const refreshBoards = useCallback(async (preferredBoardId?: number) => {
    setError(null);
    setIsLoading(true);

    try {
      const [loadedBoards, health] = await Promise.all([listBoards(), getHealth()]);
      setBoards(loadedBoards);
      setHealthStatus(health.status ?? "ok");

      if (loadedBoards.length === 0) {
        setActiveBoard(null);
      }

      setActiveBoardId((currentBoardId) => {
        return (
          preferredBoardId ??
          (loadedBoards.some((board) => board.id === currentBoardId)
            ? currentBoardId
            : loadedBoards[0]?.id ?? null)
        );
      });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshActiveBoard = useCallback(async (boardId: number) => {
    setIsBoardLoading(true);
    setError(null);

    try {
      const board = await getBoard(boardId);
      setActiveBoard(board);
    } catch (caughtError) {
      setActiveBoard(null);
      setError(getErrorMessage(caughtError));
    } finally {
      setIsBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBoards();
  }, [refreshBoards]);

  useEffect(() => {
    if (activeBoardId) {
      void refreshActiveBoard(activeBoardId);
    }
  }, [activeBoardId, refreshActiveBoard]);

  const runMutation = useCallback(
    async (mutation: () => Promise<void>) => {
      setOperationError(null);
      setIsMutating(true);

      try {
        await mutation();
      } catch (caughtError) {
        setOperationError(getErrorMessage(caughtError));
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const handleCreateBoard = useCallback(
    (title: string, description: string) =>
      runMutation(async () => {
        const board = await createBoard({
          title: title.trim(),
          description: description.trim() || null,
        });
        await refreshBoards(board.id);
      }),
    [refreshBoards, runMutation],
  );

  const handleSelectBoard = useCallback((boardId: number) => {
    setActiveBoardId(boardId);
    setOperationError(null);
  }, []);

  const handleCreateColumn = useCallback(
    (title: string) =>
      runMutation(async () => {
        if (!activeBoardId) {
          throw new Error("Сначала выберите или создайте доску.");
        }

        await createColumn(activeBoardId, {
          title: title.trim(),
          position: activeBoard?.columns.length ?? 0,
        });
        await refreshActiveBoard(activeBoardId);
      }),
    [activeBoard?.columns.length, activeBoardId, refreshActiveBoard, runMutation],
  );

  const handleSaveTask = useCallback(
    (values: TaskFormValues) =>
      runMutation(async () => {
        if (values.id) {
          await updateCard(values.id, mapTaskToApiPayload(values, true) as CardUpdate);
        } else {
          await createCard(
            values.columnId,
            mapTaskToApiPayload(values, false) as CardCreate,
          );
        }

        if (activeBoardId) {
          await refreshActiveBoard(activeBoardId);
        }
      }),
    [activeBoardId, refreshActiveBoard, runMutation],
  );

  const handleDeleteTask = useCallback(
    (taskId: number) =>
      runMutation(async () => {
        await deleteCard(taskId);

        if (activeBoardId) {
          await refreshActiveBoard(activeBoardId);
        }
      }),
    [activeBoardId, refreshActiveBoard, runMutation],
  );

  const handleMoveTask = useCallback(
    (task: Task, columnId: number) =>
      runMutation(async () => {
        await updateCard(task.id, { column_id: columnId });

        if (activeBoardId) {
          await refreshActiveBoard(activeBoardId);
        }
      }),
    [activeBoardId, refreshActiveBoard, runMutation],
  );

  const tasks = useMemo(
    () => flattenBoardTasks(activeBoard?.columns ?? []),
    [activeBoard?.columns],
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
    tasks,
    healthStatus,
    isLoading,
    isBoardLoading,
    isMutating,
    error,
    operationError,
    clearOperationError: () => setOperationError(null),
    refreshBoards,
    refreshActiveBoard,
    createBoard: handleCreateBoard,
    selectBoard: handleSelectBoard,
    createColumn: handleCreateColumn,
    saveTask: handleSaveTask,
    deleteTask: handleDeleteTask,
    moveTask: handleMoveTask,
  };
}
