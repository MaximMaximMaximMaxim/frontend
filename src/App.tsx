import { lazy, Suspense, useEffect, useState } from "react";
import { AiAssistant } from "./components/AiAssistant";
import { AppShell, type PageKey, type ThemeMode } from "./components/AppShell";
import { BoardControls } from "./components/BoardControls";
import { EmptyState } from "./components/EmptyState";
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
const MetricsPage = lazy(() =>
  import("./pages/MetricsPage").then((module) => ({ default: module.MetricsPage })),
);

const THEME_STORAGE_KEY = "syveren-theme";

function getInitialTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
}

export function App() {
  const [activePage, setActivePage] = useState<PageKey>("kanban");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const data = useKanbanData();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <AppShell
      activePage={activePage}
      theme={theme}
      onPageChange={setActivePage}
      onThemeToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
    >
      <div className="space-y-5">
        <BoardControls
          activeBoardId={data.activeBoardId}
          activeProjectId={data.activeProjectId}
          boards={data.boards}
          isDisabled={data.isLoading || data.isMutating}
          projects={data.projects}
          onCreateBoard={data.createBoard}
          onCreateProject={data.createProject}
          onSelectBoard={data.selectBoard}
          onSelectProject={data.selectProject}
        />

        {data.error ? <ErrorNotice message={data.error} /> : null}
        {data.operationError ? (
          <ErrorNotice message={data.operationError} onClose={data.clearOperationError} />
        ) : null}

        <Suspense fallback={<LoadingState label="Загрузка раздела..." />}>
          {data.isLoading ? (
            <LoadingState />
          ) : data.projects.length === 0 ? (
            <EmptyState
              description="Создайте первый проект в верхнем блоке, чтобы добавить доски, этапы и задачи."
              title="Проектов пока нет"
            />
          ) : data.isBoardLoading ? (
            <LoadingState label="Загрузка данных..." />
          ) : activePage === "dashboard" ? (
            <DashboardPage
              activeBoard={data.activeBoard}
              activeProject={data.activeProject}
              analyticsSummary={data.analyticsSummary}
              boards={data.boards}
              columns={data.columns}
              healthStatus={data.healthStatus}
              projects={data.projects}
              tasks={data.tasks}
            />
          ) : activePage === "tasks" ? (
            <TasksPage
              activeBoard={data.activeBoard}
              columns={data.columns}
              isMutating={data.isMutating}
              tasks={data.tasks}
              onSaveTask={data.saveTask}
            />
          ) : activePage === "metrics" ? (
            <MetricsPage
              activeBoard={data.activeBoard}
              activeProject={data.activeProject}
              analyticsError={data.analyticsError}
              analyticsSummary={data.analyticsSummary}
              boards={data.boards}
              columns={data.columns}
              isLoading={data.isBoardLoading}
              projects={data.projects}
              tasks={data.tasks}
              onRefreshMetrics={data.refreshAnalyticsSummary}
            />
          ) : (
            <KanbanPage
              activeBoard={data.activeBoard}
              columns={data.columns}
              isMutating={data.isMutating}
              onCreateColumn={data.createColumn}
              onMoveTask={data.moveTask}
            />
          )}
        </Suspense>
      </div>

      <AiAssistant
        hasError={Boolean(data.error || data.operationError || data.analyticsError)}
        healthStatus={data.healthStatus}
      />
    </AppShell>
  );
}
