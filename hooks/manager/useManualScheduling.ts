"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchManualScheduling,
  type ManualPublishPayload,
  type ManualScheduleBulkUpsertPayload,
  type ManualScheduleOptionsParams,
  type ManualScheduleSessionPayload,
} from "@/lib/api/services/fetchManualScheduling";
import { detailCode, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

const manualScheduleKey = (roundId: string) => ["manager", "round", roundId, "manual-schedule"] as const;

export function useManualScheduleBoard(roundId: string | null) {
  return useQuery({
    queryKey: manualScheduleKey(roundId ?? ""),
    queryFn: () => fetchManualScheduling.get(roundId as string),
    enabled: roundId !== null,
    staleTime: 10 * 1000,
  });
}

export function useManualScheduleOptions(
  roundId: string | null,
  params: ManualScheduleOptionsParams | null,
  enabled = true
) {
  return useQuery({
    queryKey: [...manualScheduleKey(roundId ?? ""), "options", params] as const,
    queryFn: () => fetchManualScheduling.options(roundId as string, params as ManualScheduleOptionsParams),
    enabled: roundId !== null && params !== null && enabled,
    staleTime: 5 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

function useInvalidateManualSchedule() {
  const queryClient = useQueryClient();
  return (roundId: string) => queryClient.invalidateQueries({ queryKey: manualScheduleKey(roundId) });
}

export function useCreateManualScheduleSession() {
  const invalidate = useInvalidateManualSchedule();
  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: ManualScheduleSessionPayload }) =>
      fetchManualScheduling.createSession(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã lưu hội đồng");
    },
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không lưu được hội đồng")),
  });
}

export function useUpdateManualScheduleSession() {
  const invalidate = useInvalidateManualSchedule();
  return useMutation({
    mutationFn: ({
      roundId,
      sessionId,
      payload,
    }: {
      roundId: string;
      sessionId: string;
      payload: ManualScheduleSessionPayload;
    }) => fetchManualScheduling.updateSession(roundId, sessionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã cập nhật hội đồng");
    },
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không cập nhật được hội đồng")),
  });
}

export function useDeleteManualScheduleSession() {
  const invalidate = useInvalidateManualSchedule();
  return useMutation({
    mutationFn: ({
      roundId,
      sessionId,
      clientRevision,
    }: {
      roundId: string;
      sessionId: string;
      clientRevision?: number | null;
    }) => fetchManualScheduling.deleteSession(roundId, sessionId, clientRevision),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã xóa hội đồng");
    },
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không xóa được hội đồng")),
  });
}

export function useBulkUpsertManualSchedule() {
  const invalidate = useInvalidateManualSchedule();
  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: ManualScheduleBulkUpsertPayload }) =>
      fetchManualScheduling.bulkUpsert(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã lưu lịch thủ công");
    },
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không lưu được lịch thủ công")),
  });
}

export function useValidateManualSchedule() {
  return useMutation({
    mutationFn: ({ roundId, clientRevision }: { roundId: string; clientRevision?: number | null }) =>
      fetchManualScheduling.validate(roundId, clientRevision),
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không kiểm tra được lịch")),
  });
}

export function useManualScheduleReadiness(roundId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...manualScheduleKey(roundId ?? ""), "publish-readiness"] as const,
    queryFn: () => fetchManualScheduling.publishReadiness(roundId as string),
    enabled: roundId !== null && enabled,
    staleTime: 5 * 1000,
  });
}

export function usePublishManualSchedule() {
  const invalidate = useInvalidateManualSchedule();
  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: ManualPublishPayload }) =>
      fetchManualScheduling.publish(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã công bố lịch thủ công");
    },
    onError: (error: ApiError) => {
      // PUBLISH_BLOCKED is rendered in the board's validation drawer so the manager
      // can act on the returned blockers instead of losing them in a toast.
      if (detailCode(error) !== "PUBLISH_BLOCKED") {
        toast.error(friendlyErrorMessage(error, "Không công bố được lịch"));
      }
    },
  });
}

export { manualScheduleKey };
