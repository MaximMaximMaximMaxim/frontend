const DEFAULT_API_BASE_URL = "https://api.ustyantsevmd.ru";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "msg" in item &&
        typeof item.msg === "string"
      ) {
        return item.msg;
      }

      return null;
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join("; ") : null;
}

function getRussianErrorMessage(status: number, detail: unknown): string {
  if (status === 422 && detail && typeof detail === "object" && "detail" in detail) {
    const validationMessage = formatValidationDetail(detail.detail);
    if (validationMessage) {
      return `Проверьте заполнение формы: ${validationMessage}`;
    }
  }

  if (status === 404) {
    return "Запрошенные данные не найдены в API.";
  }

  if (status >= 500) {
    return "API временно недоступен. Попробуйте повторить действие позже.";
  }

  return "Не удалось выполнить запрос к API. Проверьте данные и попробуйте ещё раз.";
}

interface RequestOptions extends RequestInit {
  body?: BodyInit | null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail: unknown = null;

    try {
      detail = await response.json();
    } catch {
      detail = null;
    }

    throw new ApiError(getRussianErrorMessage(response.status, detail), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function jsonBody(payload: unknown): string {
  return JSON.stringify(payload);
}
