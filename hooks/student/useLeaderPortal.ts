"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchLeaderPortal,
  type SubmitGroupPreferencePayload,
} from "@/lib/api/services/fetchLeaderPortal";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /leader/me/dashboard — spec §38 */
export function useLeaderDashboard() {
  return useQuery({
    queryKey: ["leader", "dashboard"] as const,
    queryFn: fetchLeaderPortal.dashboard,
    staleTime: Infinity,
  });
}

/** GET /rounds/:roundId/groups/:groupId/preferences — spec §39 */
export function useGroupPreferences(roundId: string | null, groupId: string | null) {
  return useQuery({
    queryKey: ["leader", "preferences", roundId, groupId] as const,
    queryFn: () => fetchLeaderPortal.groupPreferences(roundId as string, groupId as string),
    enabled: roundId !== null && groupId !== null,
    staleTime: Infinity,
  });
}

/** PUT /rounds/:roundId/groups/:groupId/preferences — spec §39/§56 */
export function useSubmitGroupPreferences(roundId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitGroupPreferencePayload) =>
      fetchLeaderPortal.submitGroupPreferences(roundId, groupId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leader", "preferences", roundId, groupId] });
      await queryClient.invalidateQueries({ queryKey: ["leader", "dashboard"] });
      toast.success("Đã lưu nguyện vọng khung giờ");
    },
    onError: (error: ApiError) => {
      toast.error(
        friendlyErrorMessage(error, "Không lưu được nguyện vọng — kiểm tra đợt còn mở đăng ký và bạn đang là Leader")
      );
    },
  });
}

/** GET /leader/me/sessions — spec §40 */
export function useLeaderSessions() {
  return useQuery({
    queryKey: ["leader", "sessions"] as const,
    queryFn: fetchLeaderPortal.mySessions,
    staleTime: Infinity,
  });
}
