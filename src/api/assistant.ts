import type { AssistantAnalyzeResponse, AssistantChatMessage } from "../types/api";

const DEFAULT_ASSISTANT_API_BASE_URL = "/assistant-api";

export const ASSISTANT_API_BASE_URL =
  import.meta.env.VITE_ASSISTANT_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_ASSISTANT_API_BASE_URL;

function buildAssistantUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${ASSISTANT_API_BASE_URL}${normalizedPath}`;
}

function getAssistantErrorMessage(detail: unknown): string {
  if (detail && typeof detail === "object" && "detail" in detail) {
    return "Ассистент не принял запрос. Проверьте текст и попробуйте ещё раз.";
  }

  return "Ассистент временно недоступен. Попробуйте ещё раз позже.";
}

export async function analyzeMessages(
  messages: AssistantChatMessage[],
): Promise<AssistantAnalyzeResponse> {
  const response = await fetch(buildAssistantUrl("/analyze"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    let detail: unknown = null;

    try {
      detail = await response.json();
    } catch {
      detail = null;
    }

    throw new Error(getAssistantErrorMessage(detail));
  }

  return (await response.json()) as AssistantAnalyzeResponse;
}
