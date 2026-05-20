import { ColumnForm } from "../components/ColumnForm";
import { EmptyState } from "../components/EmptyState";
import type { BoardDetail } from "../types/api";
import type { Task } from "../types/task";

interface KanbanPageProps {
  activeBoard: BoardDetail | null;
  isMutating: boolean;
  onCreateColumn: (title: string) => void;
  onMoveTask: (task: Task, columnId: number) => void;
}

export function KanbanPage({
  activeBoard,
  isMutating,
  onCreateColumn,
  onMoveTask,
}: KanbanPageProps) {
  if (!activeBoard) {
    return (
      <EmptyState
        description="Создайте или выберите доску, чтобы увидеть Kanban."
        title="Доска не выбрана"
      />
    );
  }

  const columns = activeBoard.columns;

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Канбан</h2>
            <p className="mt-1 text-sm text-slate-600">
              Колонки используются как этапы задачи в рамках текущего API.
            </p>
          </div>
          <ColumnForm isDisabled={isMutating} onCreateColumn={onCreateColumn} />
        </div>
      </section>

      {columns.length === 0 ? (
        <EmptyState
          description="У выбранной доски нет колонок. Добавьте первый этап, чтобы создавать карточки-задачи."
          title="Этапы не созданы"
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={column.id}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">{column.title}</h3>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                  {column.cards.length}
                </span>
              </div>

              {column.cards.length > 0 ? (
                <div className="space-y-3">
                  {column.cards
                    .slice()
                    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
                    .map((card) => {
                      const task: Task = {
                        ...card,
                        position: card.position ?? 0,
                        description: card.description ?? "",
                        columnId: column.id,
                        columnTitle: column.title,
                      };

                      return (
                        <article className="rounded-lg bg-white p-4 shadow-sm" key={card.id}>
                          <h4 className="text-sm font-semibold text-slate-950">{card.title}</h4>
                          {card.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                          ) : null}
                          <label
                            className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                            htmlFor={`move-${card.id}`}
                          >
                            Переместить в этап
                          </label>
                          <select
                            className="field mt-2"
                            disabled={isMutating}
                            id={`move-${card.id}`}
                            value={column.id}
                            onChange={(event) => onMoveTask(task, Number(event.target.value))}
                          >
                            {columns.map((targetColumn) => (
                              <option key={targetColumn.id} value={targetColumn.id}>
                                {targetColumn.title}
                              </option>
                            ))}
                          </select>
                        </article>
                      );
                    })}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500">
                  В этом этапе пока нет карточек.
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
