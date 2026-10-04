import axios from "axios";

const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
  ).trim(),
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Extract a readable error message from an Axios/API error.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    if (data) {
      const errors = data.errors;

      if (errors && typeof errors === "object") {
        return Object.values(errors as Record<string, unknown>)
          .map(String)
          .join("\n");
      }

      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }

      if (typeof data.error === "string" && typeof data.path === "string") {
        const status =
          typeof data.status === "number" ? ` (${data.status})` : "";

        return `${data.error}${status}\nAPI: ${data.path}`;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

/**
 * Retry a request when a temporary network/server error occurs.
 *
 * retries = 2 means:
 * - First request
 * - Retry #1 after 2 seconds
 * - Retry #2 after 5 seconds
 *
 * 4xx errors are not retried because they normally indicate
 * a real client/request problem.
 */
export async function withRetry<T>(
  request: () => Promise<T>,
  retries = 2,
  delays = [2000, 5000],
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await request();
    } catch (error) {
      // No more retries left.
      if (attempt === retries) {
        throw error;
      }

      // Do not retry normal client errors such as:
      // 400, 401, 403, 404, 409, ...
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status !== undefined && status < 500) {
          throw error;
        }
      }

      const delay = delays[attempt] ?? delays[delays.length - 1] ?? 2000;

      console.warn(`API request failed. Retrying in ${delay}ms...`, error);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }

  throw new Error("Request failed after retries.");
}

export default api;
