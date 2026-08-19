"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchNotifications } from "@/lib/api/services/fetchNotifications";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /notifications?limit= */
export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: managerKeys.notifications(limit),
    queryFn: () => fetchNotifications.list(limit),
    staleTime: 15 * 1000,
  });
}

export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => fetchNotifications.retry(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "notifications"] });
      toast.success("Đã gửi lại thông báo");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Chỉ retry được thông báo đang ở trạng thái FAILED"));
    },
  });
}
