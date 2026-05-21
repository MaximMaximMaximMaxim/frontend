import type { ReactNode } from "react";

export type PageKey = "dashboard" | "tasks" | "kanban" | "metrics";
export type ThemeMode = "light" | "dark";

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Дашборд" },
  { key: "tasks", label: "Задачи" },
  { key: "kanban", label: "Канбан" },
  { key: "metrics", label: "Метрики" },
];

interface AppShellProps {
  activePage: PageKey;
  theme: ThemeMode;
  onPageChange: (page: PageKey) => void;
  onThemeToggle: () => void;
  children: ReactNode;
}

function AppLogo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M3.5 4.5h5v4h-5v-4ZM9.5 9.5h5v4h-5v-4Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="M10.5 4.5h3a1 1 0 0 1 1 1v3M3.5 10.5v2a1 1 0 0 0 1 1h3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
    </span>
  );
}

function ThemeIcon({ theme }: { theme: ThemeMode }) {
  return theme === "dark" ? (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" aria-hidden="true">
      <path
        d="M13 9.4A5.4 5.4 0 0 1 6.6 3a5.5 5.5 0 1 0 6.4 6.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ) : (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" aria-hidden="true">
      <path
        d="M8 4.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6ZM8 1.5v1.1M8 13.4v1.1M14.5 8h-1.1M2.6 8H1.5M12.6 3.4l-.8.8M4.2 11.8l-.8.8M12.6 12.6l-.8-.8M4.2 4.2l-.8-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function AppShell({
  activePage,
  theme,
  onPageChange,
  onThemeToggle,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner mx-auto max-w-[90rem] px-4 py-4 sm:px-6 lg:px-8">
          <div className="brand-lockup">
            <AppLogo />
            <div className="min-w-0">
              <h1 className="app-title">Управление задачами</h1>
              <p className="app-subtitle">Kanban, метрики и аналитика команды</p>
            </div>
          </div>

          <div className="app-actions">
            <nav className="app-nav" aria-label="Основные разделы">
              {navItems.map((item) => (
                <button
                  className={
                    activePage === item.key ? "nav-button nav-button--active" : "nav-button"
                  }
                  key={item.key}
                  type="button"
                  onClick={() => onPageChange(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button
              aria-label={
                theme === "dark" ? "Включить светлую тему" : "Включить темную тему"
              }
              className="theme-toggle"
              type="button"
              onClick={onThemeToggle}
            >
              <ThemeIcon theme={theme} />
              <span>{theme === "dark" ? "Светлая" : "Тёмная"}</span>
            </button>

            <button className="btn-primary" type="button" onClick={() => onPageChange("tasks")}>
              + Задача
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
