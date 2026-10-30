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
 * Extract a useful, user-facing message from API and network errors.
 * Supports the backend's { message }, { errors }, and Spring ProblemDetail shapes.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const status = response?.status;
    const data = response?.data;

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      const errors = payload.errors;

      if (Array.isArray(errors)) {
        const messages = errors
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const entry = item as Record<string, unknown>;
              return String(entry.defaultMessage ?? entry.message ?? "");
            }
            return "";
          })
          .filter(Boolean);
        if (messages.length > 0) return messages.join("\n");
      }

      if (errors && typeof errors === "object") {
        const fieldLabels: Record<string, string> = {
          title: "Tiêu đề phim",
          releaseYear: "Năm phát hành",
          totalEpisodes: "Số tập",
          fullName: "Họ và tên",
          gender: "Giới tính",
          name: "Tên thể loại",
          dob: "Ngày sinh",
          request: "Thông tin",
        };
        const messages = Object.entries(errors as Record<string, unknown>)
          .map(([field, message]) => {
            const readableMessage = Array.isArray(message)
              ? message.map(String).join(", ")
              : String(message);
            return readableMessage.trim()
              ? `${fieldLabels[field] ?? field}: ${readableMessage.trim()}`
              : "";
          })
          .filter(Boolean);
        if (messages.length > 0) return messages.join("\n");
      }

      const genericFrameworkMessages = new Set([
        "internal server error",
        "bad request",
        "conflict",
        "not found",
        "forbidden",
        "unauthorized",
      ]);
      for (const key of ["message", "detail", "description"]) {
        const value = payload[key];
        if (
          typeof value === "string" &&
          value.trim() &&
          !genericFrameworkMessages.has(value.trim().toLowerCase())
        ) {
          return value.trim();
        }
      }

      // Do not display generic framework labels such as "Internal Server Error"
      // when a more helpful HTTP status explanation is available below.
    }

    if (status !== undefined) {
      const statusMessages: Record<number, string> = {
        400: "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại thông tin.",
        401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
        403: "Bạn không có quyền thực hiện thao tác này.",
        404: "Không tìm thấy dữ liệu cần thao tác.",
        409: "Dữ liệu bị trùng hoặc đang được dữ liệu khác sử dụng.",
        413: "Dữ liệu gửi lên quá lớn.",
        415: "Định dạng dữ liệu không được hỗ trợ.",
        422: "Dữ liệu không đáp ứng các điều kiện xử lý.",
        429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
      };
      if (statusMessages[status]) return `${statusMessages[status]} (HTTP ${status})`;
      if (status >= 500) {
        return `Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau. (HTTP ${status})`;
      }
    }

    if (error.message && error.message !== "Network Error") {
      return error.message;
    }
    if (error.message === "Network Error") {
      return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc trạng thái backend.";
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message;
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
