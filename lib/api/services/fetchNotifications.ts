import apiService from "../core";
import { normalizeToSnakeCase } from "../compat";

export interface NotificationItem {
  id: number;
  event_type: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "SENT" | "FAILED";
  sent_at: string | null;
  created_at: string;
}

export interface RetryNotificationResponse {
  id: number;
  status: "PENDING";
  dedupe_key: string;
}

export const fetchNotifications = {
  /** GET /notifications?limit= — tất cả role. Manager/Admin thấy scope quản lý */
  list: async (limit = 50): Promise<NotificationItem[]> => {
    const response = await apiService.get<unknown, { limit: number }>("api/v1/notifications", { limit });
    return normalizeToSnakeCase<NotificationItem[]>(response.data);
  },

  /** POST /notifications/{notification_id}/retry — ADMIN, MANAGER. Chỉ retry notification FAILED */
  retry: async (notificationId: number): Promise<RetryNotificationResponse> => {
    const response = await apiService.post<unknown, undefined>(`api/v1/notifications/${notificationId}/retry`);
    return normalizeToSnakeCase<RetryNotificationResponse>(response.data);
  },
};
