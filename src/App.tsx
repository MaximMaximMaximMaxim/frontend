import { lazy, Suspense, useState } from "react";
import { AppShell, type PageKey } from "./components/AppShell";
import { BoardControls } from "./components/BoardControls";
import { ErrorNotice } from "./components/ErrorNotice";
import { LoadingState } from "./components/LoadingState";
import { useKanbanData } from "./hooks/useKanbanData";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const TasksPage = lazy(() =>
  import("./pages/TasksPage").then((module) => ({ default: module.TasksPage })),
);
const KanbanPage = lazy(() =>
  import("./pages/KanbanPage").then((module) => ({ default: module.KanbanPage })),
);

export function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const data = useKanbanData();

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      <div className="space-y-5">
        <BoardControls
          activeBoardId={data.activeBoardId}
          boards={data.boards}
          isDisabled={data.isLoading || data.isMutating}
          onCreateBoard={data.createBoard}
          onSelectBoard={data.selectBoard}
        />

        {data.error ? <ErrorNotice message={data.error} /> : null}
        {data.operationError ? (
          <ErrorNotice message={data.operationError} onClose={data.clearOperationError} />
        ) : null}

        <Suspense fallback={<LoadingState label="Загрузка раздела..." />}>
          {data.isLoading ? (
            <LoadingState />
          ) : data.isBoardLoading ? (
            <LoadingState label="Загрузка выбранной доски..." />
          ) : activePage === "dashboard" ? (
            <DashboardPage
              activeBoard={data.activeBoard}
              boards={data.boards}
              healthStatus={data.healthStatus}
              tasks={data.tasks}
            />
          ) : activePage === "tasks" ? (
            <TasksPage
              activeBoard={data.activeBoard}
              isMutating={data.isMutating}
              tasks={data.tasks}
              onDeleteTask={data.deleteTask}
              onSaveTask={data.saveTask}
            />
          ) : (
            <KanbanPage
              activeBoard={data.activeBoard}
              isMutating={data.isMutating}
              onCreateColumn={data.createColumn}
              onMoveTask={data.moveTask}
            />
          )}
        </Suspense>
      </div>
    </AppShell>
  );
}
