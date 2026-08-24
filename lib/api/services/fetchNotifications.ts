import apiService from "../core";

export interface NotificationItem {
  id: number;
  eventType: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt: string | null;
  createdAt: string;
}

export interface RetryNotificationResponse {
  id: number;
  status: "PENDING";
  dedupeKey: string;
}

export const fetchNotifications = {
  /** GET /notifications?limit= — tất cả role. Manager/Admin thấy scope quản lý */
  list: async (limit = 50): Promise<NotificationItem[]> => {
    const response = await apiService.get<NotificationItem[], { limit: number }>("api/v1/notifications", { limit });
    return response.data;
  },

  /** POST /notifications/{notification_id}/retry — ADMIN, MANAGER. Chỉ retry notification FAILED */
  retry: async (notificationId: number): Promise<RetryNotificationResponse> => {
    const response = await apiService.post<RetryNotificationResponse, undefined>(`api/v1/notifications/${notificationId}/retry`);
    return response.data;
  },
};
