import { useState } from "react";
import assistantBlueUrl from "../assets/assistant/assistant-blue.png";
import assistantRedUrl from "../assets/assistant/assistant-red.png";

interface AiAssistantProps {
  healthStatus: string | null;
  hasError: boolean;
}

const FUTURE_COMMANDS = [
  "Показать риски",
  "Просроченные задачи",
  "Кто перегружен?",
  "Сводка по проекту",
  "Что требует внимания?",
];

function AssistantAvatarImage({ isHealthy }: { isHealthy: boolean }) {
  return (
    <img
      alt=""
      className="ai-avatar-circles"
      src={isHealthy ? assistantBlueUrl : assistantRedUrl}
    />
  );
}

export function AiAssistant({ healthStatus, hasError }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isHealthy = healthStatus === "ok" && !hasError;
  const statusLabel = isHealthy ? "API в норме" : "Есть проблема с API или данными";

  return (
    <div className="ai-assistant" aria-live="polite">
      {isOpen ? (
        <section className="ai-assistant-panel">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={
                  isHealthy
                    ? "ai-assistant-avatar ai-assistant-avatar--ok"
                    : "ai-assistant-avatar ai-assistant-avatar--risk"
                }
              >
                <AssistantAvatarImage isHealthy={isHealthy} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-950">
                  ИИ-ассистент менеджера
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{statusLabel}</p>
              </div>
            </div>
            <button
              aria-label="Закрыть ИИ-ассистента"
              className="ai-assistant-close"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Будущий помощник для анализа задач, сроков и рисков
          </p>
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            ИИ-ассистент пока недоступен: в текущей OpenAPI-спецификации отсутствует endpoint
            для AI-аналитики.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {FUTURE_COMMANDS.map((command) => (
              <button className="ai-command-chip" disabled key={command} type="button">
                {command}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <button
        aria-label="Открыть ИИ-ассистента менеджера"
        className={
          isHealthy
            ? "ai-assistant-button ai-assistant-button--ok"
            : "ai-assistant-button ai-assistant-button--risk"
        }
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <AssistantAvatarImage isHealthy={isHealthy} />
        <span className="ai-assistant-indicator" />
      </button>
    </div>
  );
}
