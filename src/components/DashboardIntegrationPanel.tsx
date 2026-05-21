import type { DashboardIntegrationItem } from "../types/insights";

interface DashboardIntegrationPanelProps {
  items: DashboardIntegrationItem[];
}

export function DashboardIntegrationPanel({ items }: DashboardIntegrationPanelProps) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Будущие аналитические блоки</h3>
          <p className="text-sm text-slate-600">
            Эти зоны готовы под подключение метрик, AI-инсайтов и расширенных дашбордов.
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {items.length} слота
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article className="rounded-md border border-slate-200 bg-white p-4" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-950">{item.title}</h4>
              <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                {item.statusLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-4 rounded-md bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500">
              {item.endpoint}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
