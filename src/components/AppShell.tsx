import type { ReactNode } from "react";

export type PageKey = "dashboard" | "tasks" | "kanban";

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Дашборд" },
  { key: "tasks", label: "Задачи" },
  { key: "kanban", label: "Канбан" },
];

interface AppShellProps {
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
  children: ReactNode;
}

export function AppShell({ activePage, onPageChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Управление задачами</h1>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Основные разделы">
            {navItems.map((item) => (
              <button
                className={
                  activePage === item.key
                    ? "rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-md px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                }
                key={item.key}
                type="button"
                onClick={() => onPageChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
