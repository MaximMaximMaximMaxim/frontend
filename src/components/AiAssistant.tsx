import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { analyzeMessages } from "../api/assistant";
import assistantBlueUrl from "../assets/assistant/assistant-blue.png";
import assistantRedUrl from "../assets/assistant/assistant-red.png";
import type {
  AnalyticsMetaMetrics,
  AnalyticsMetrics,
  AnalyticsValue,
  AssistantChatMessage,
  BoardRead,
  ProjectRead,
} from "../types/api";

interface AiAssistantProps {
  activeProject: ProjectRead | null;
  activeBoard: BoardRead | null;
  analyticsMetrics: AnalyticsMetrics | null;
  analyticsMetaMetrics: AnalyticsMetaMetrics | null;
  healthStatus: string | null;
  hasError: boolean;
}

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  errors?: string[];
}

const INTRO_MESSAGE: UiMessage = {
  id: "assistant-intro",
  role: "assistant",
  content:
    "Я на связи. Могу разобрать метрики, найти риски, посмотреть задачи в работе, закрытые задачи за период, просрочки и качество потока по текущему проекту.",
};

const SUGGESTED_PROMPTS = [
  "Где сейчас главный риск?",
  "Покажи риски по текущей доске",
  "Сколько задач в работе и закрыто?",
  "Как обстоят дела с багами?",
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

function buildContextPrompt(
  prompt: string,
  activeProject: ProjectRead | null,
  activeBoard: BoardRead | null,
  healthStatus: string | null,
) {
  const context = [
    "Контекст интерфейса Kanban:",
    activeProject
      ? `project_id=${activeProject.id}, проект="${activeProject.name}"`
      : "проект не выбран",
    activeBoard ? `board_id=${activeBoard.id}, доска="${activeBoard.name}"` : "доска не выбрана",
    `health_status=${healthStatus ?? "unknown"}`,
    "Если вопрос относится к текущей доске или проекту, используй эти project_id и board_id в запросах к analytics API.",
    "Контракт метрик: задачи в работе (wip), закрытые задачи за период (throughput), баги (bug_count), status_counts, time_in_status_hours_avg и priority_mix запрашиваются через /analytics/metrics.",
    "Контракт метаметрик: стабильность сроков (predictability_score), незакрытый прирост задач (flow_debt), нагрузка к закрытию (wip_to_throughput_ratio), percentiles и bottleneck_detection запрашиваются через /analytics/metametrics.",
    "Не используй /analytics/metametrics для прямых ключей wip или throughput.",
  ].join("\n");

  return `${context}\n\nВопрос менеджера: ${prompt}`;
}

function normalizeAssistantResponse(answer: string | undefined, errors: string[] | undefined) {
  const cleanAnswer = answer?.trim();
  if (cleanAnswer) {
    return cleanAnswer;
  }

  if (errors?.length) {
    return "Ассистент получил данные, но не смог собрать финальный ответ.";
  }

  return "Ассистент вернул пустой ответ. Попробуйте переформулировать вопрос.";
}

function hasAgentExecutionError(errors: string[] | undefined) {
  return Boolean(
    errors?.some(
      (error) =>
        error.includes("RetryError") ||
        error.includes("HTTPStatusError") ||
        error.includes("Ошибка запроса"),
    ),
  );
}

function formatMetricNumber(value: AnalyticsValue | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "нет данных";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(2)}${suffix}`;
}

function formatMetricRatio(value: AnalyticsValue | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "нет данных";
  }

  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(0)}%`;
}

function buildLocalMetricAnswer(
  prompt: string,
  activeProject: ProjectRead | null,
  activeBoard: BoardRead | null,
  analyticsMetrics: AnalyticsMetrics | null,
  analyticsMetaMetrics: AnalyticsMetaMetrics | null,
) {
  if (!analyticsMetrics && !analyticsMetaMetrics) {
    return null;
  }

  const normalizedPrompt = prompt.toLowerCase();
  const scope = [
    activeProject ? `проект "${activeProject.name}"` : null,
    activeBoard ? `доска "${activeBoard.name}"` : null,
  ]
    .filter(Boolean)
    .join(", ");

  if (
    normalizedPrompt.includes("wip") ||
    normalizedPrompt.includes("throughput") ||
    normalizedPrompt.includes("в работе") ||
    normalizedPrompt.includes("закрыто")
  ) {
    return [
      `По текущему контексту${scope ? ` (${scope})` : ""}:`,
      `- Сейчас в работе: ${formatMetricNumber(analyticsMetrics?.wip)}`,
      `- Закрыто за период: ${formatMetricNumber(analyticsMetrics?.throughput)}`,
      `- Незакрытый прирост задач: ${formatMetricNumber(analyticsMetaMetrics?.flow_debt)}`,
      "Сводка собрана по текущим показателям проекта.",
    ].join("\n");
  }

  if (normalizedPrompt.includes("баг") || normalizedPrompt.includes("bug")) {
    return [
      `По текущему контексту${scope ? ` (${scope})` : ""}:`,
      `- Баги: ${formatMetricNumber(analyticsMetrics?.bug_count)}`,
      `- Среднее закрытие багов: ${formatMetricNumber(analyticsMetrics?.bug_fix_time_hours_avg, " ч")}`,
      "- Разрез типов работ доступен в текущих показателях.",
    ].join("\n");
  }

  if (
    normalizedPrompt.includes("риск") ||
    normalizedPrompt.includes("вниман") ||
    normalizedPrompt.includes("требует")
  ) {
    return [
      `Что стоит проверить${scope ? ` (${scope})` : ""}:`,
      `- Сейчас в работе: ${formatMetricNumber(analyticsMetrics?.wip)}`,
      `- Закрыто за период: ${formatMetricNumber(analyticsMetrics?.throughput)}`,
      `- Давно в работе: ${formatMetricNumber(analyticsMetrics?.aging_wip_count)}`,
      `- Закрыто в срок: ${formatMetricRatio(analyticsMetrics?.on_time_delivery)}`,
      `- Стабильность сроков: ${formatMetricNumber(analyticsMetaMetrics?.predictability_score)}`,
      "Это сводка по текущим показателям доски.",
    ].join("\n");
  }

  return null;
}

export function AiAssistant({
  activeProject,
  activeBoard,
  analyticsMetrics,
  analyticsMetaMetrics,
  healthStatus,
  hasError,
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([INTRO_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [hasAssistantResponseError, setHasAssistantResponseError] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const isHealthy = assistantError === null && !hasAssistantResponseError;
  const shouldShowSuggestedPrompts = !messages.some((message) => message.role === "user");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, isSending, messages.length]);

  const statusLabel = useMemo(() => {
    if (isSending) {
      return "Ассистент анализирует данные";
    }

    if (assistantError || hasAssistantResponseError) {
      return "Есть проблема с ассистентом";
    }

    if (hasError) {
      return "Часть данных проекта пока недоступна";
    }

    return "Готов к аналитике проекта";
  }, [assistantError, hasAssistantResponseError, hasError, isSending]);

  const submitPrompt = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || isSending) {
      return;
    }

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    };

    const historyForApi: AssistantChatMessage[] = messages
      .filter((message) => message.id !== INTRO_MESSAGE.id && !message.errors?.length)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setDraft("");
    setAssistantError(null);
    setHasAssistantResponseError(false);
    setIsSending(true);

    try {
      const response = await analyzeMessages([
        ...historyForApi,
        {
          role: "user",
          content: buildContextPrompt(prompt, activeProject, activeBoard, healthStatus),
        },
      ]);

      const fallbackAnswer = hasAgentExecutionError(response.errors)
        ? buildLocalMetricAnswer(
            prompt,
            activeProject,
            activeBoard,
            analyticsMetrics,
            analyticsMetaMetrics,
          )
        : null;
      const hasEmptyErrorResponse = Boolean(
        response.errors?.length && !fallbackAnswer && !response.answer?.trim(),
      );

      const assistantMessage: UiMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          fallbackAnswer ?? normalizeAssistantResponse(response.answer, response.errors),
      };

      setHasAssistantResponseError(hasEmptyErrorResponse);
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Ассистент временно недоступен. Попробуйте ещё раз позже.";

      setAssistantError(message);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitPrompt(draft);
  };

  return (
    <div className="ai-assistant" aria-live="polite">
      {isOpen ? (
        <section className="ai-assistant-panel">
          <div className="ai-assistant-header flex items-start justify-between gap-4">
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
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
                <path
                  d="M5 5l8 8M13 5l-8 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.9"
                />
              </svg>
            </button>
          </div>

          <div className="ai-assistant-context">
            <span>{activeProject ? activeProject.name : "Проект не выбран"}</span>
            <span>{activeBoard ? activeBoard.name : "Доска не выбрана"}</span>
          </div>

          <div className="ai-message-list" aria-live="polite">
            {messages.map((message) => (
              <article
                className={
                  message.role === "user"
                    ? "ai-message ai-message--user"
                    : "ai-message ai-message--assistant"
                }
                key={message.id}
              >
                <p>{message.content}</p>
                {message.errors?.length ? (
                  <details className="ai-message-errors">
                    <summary>Ошибки выполнения</summary>
                    <ul>
                      {message.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </article>
            ))}
            {isSending ? (
              <article className="ai-message ai-message--assistant">
                <p>Смотрю метрики и собираю ответ...</p>
              </article>
            ) : null}
            <div ref={messageEndRef} aria-hidden="true" />
          </div>

          {shouldShowSuggestedPrompts ? (
            <div className="ai-command-grid" aria-label="Быстрые запросы">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  className="ai-command-chip"
                  disabled={isSending}
                  key={prompt}
                  type="button"
                  onClick={() => void submitPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          {assistantError ? <p className="ai-assistant-error">{assistantError}</p> : null}

          <form className="ai-input-row" onSubmit={handleSubmit}>
            <textarea
              aria-label="Вопрос ассистенту"
              className="field ai-input"
              disabled={isSending}
              placeholder="Спросите про риски или сроки"
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="btn-primary ai-send-button" disabled={isSending || !draft.trim()} type="submit">
              Отправить
            </button>
          </form>
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
