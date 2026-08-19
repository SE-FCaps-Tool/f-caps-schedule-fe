"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchScheduling,
  type H11WaiverPayload,
  type PostponeSessionPayload,
  type RescheduleDecisionPayload,
  type ResultOwnerPayload,
  type RoundOperationPayload,
  type ScheduleRunPayload,
  type SessionEditPayload,
} from "@/lib/api/services/fetchScheduling";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { detailMessage, detailViolations, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/**
 * Invalidate mọi query có thể lỗi thời sau một thao tác sửa lịch — theo checklist
 * "Cache invalidation phía FE" cuối results-reports.md.
 */
function useInvalidateAfterScheduleChange() {
  const queryClient = useQueryClient();
  return async (roundId?: number) => {
    if (roundId) {
      await queryClient.invalidateQueries({ queryKey: managerKeys.scheduleVersions(roundId) });
      await queryClient.invalidateQueries({ queryKey: managerKeys.dashboard(roundId) });
    }
    await queryClient.invalidateQueries({ queryKey: ["manager", "version"] });
    await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["manager", "notifications"] });
  };
}

export function useRunSchedule() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      roundId,
      payload,
      semesterId,
    }: {
      roundId: number;
      payload?: ScheduleRunPayload;
      semesterId?: number | null;
    }) => fetchScheduling.run(roundId, payload, semesterId),
    onSuccess: async (data, variables) => {
      await invalidate(variables.roundId);
      toast.success(
        data.unscheduled.length > 0
          ? `Đã chạy xếp lịch: ${data.scheduled_count} nhóm xếp được, ${data.unscheduled.length} nhóm chưa xếp được`
          : `Đã xếp lịch đủ ${data.scheduled_count} nhóm`
      );
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error(detailMessage(error) || "Thiếu input để chạy xếp lịch (nhóm/timeslot/phòng/lịch rảnh giảng viên)");
        return;
      }
      if (error.code === 409) {
        toast.error("Đã có kết quả solver nhưng không lưu được — thử lại");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không chạy được thuật toán xếp lịch"));
    },
  });
}

/** GET /rounds/{round_id}/schedule/versions?semester_id= */
export function useScheduleVersions(roundId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.scheduleVersions(roundId ?? 0),
    queryFn: () => fetchScheduling.versions(roundId as number, semesterId),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /schedule/versions/{version_id}?semester_id= — nguồn dữ liệu chính cho Calendar (phòng/giờ/reviewer thật) */
export function useScheduleVersion(versionId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.scheduleVersion(versionId ?? 0),
    queryFn: () => fetchScheduling.versionDetail(versionId as number, semesterId),
    enabled: versionId !== null,
    staleTime: 15 * 1000,
  });
}

export function useActivateVersion() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({ versionId, semesterId }: { versionId: number; roundId: number; semesterId?: number | null }) =>
      fetchScheduling.activate(versionId, semesterId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã kích hoạt phương án lịch");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Chỉ phương án VALID mới kích hoạt được"));
    },
  });
}

export function usePublishVersion() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      roundId,
      versionId,
      semesterId,
    }: {
      roundId: number;
      versionId: number;
      semesterId?: number | null;
    }) => fetchScheduling.publish(roundId, versionId, semesterId),
    onSuccess: async (data, variables) => {
      await invalidate(variables.roundId);
      toast.success(`Đã công bố lịch tới ${data.recipient_count} người liên quan`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Phương án phải được kích hoạt và hợp lệ trước khi công bố"));
    },
  });
}

export function useEditSession() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      versionId,
      sessionId,
      payload,
      semesterId,
    }: {
      versionId: number;
      sessionId: number;
      roundId?: number;
      semesterId?: number | null;
      payload: SessionEditPayload;
    }) => fetchScheduling.editSession(versionId, sessionId, payload, semesterId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã cập nhật phiên đánh giá");
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        const violations = detailViolations(error);
        toast.error(
          violations && violations.length > 0
            ? `Vi phạm ràng buộc cứng: ${violations.length} lỗi`
            : detailMessage(error) || "Vi phạm ràng buộc cứng (trùng giờ giảng viên/phòng)"
        );
        return;
      }
      if (error.code === 409) {
        toast.error("Phiên vừa bị thay đổi bởi thao tác khác — tải lại rồi thử lại");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không sửa được phiên đánh giá"));
    },
  });
}

export function useControlledChangeSession() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      versionId,
      sessionId,
      payload,
      semesterId,
    }: {
      versionId: number;
      sessionId: number;
      roundId?: number;
      semesterId?: number | null;
      payload: SessionEditPayload;
    }) => fetchScheduling.controlledChangeSession(versionId, sessionId, payload, semesterId),
    onSuccess: async (data, variables) => {
      await invalidate(variables.roundId);
      toast.success(`Đã tạo phương án mới V${data.version_id} với thay đổi có kiểm soát`);
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error(detailMessage(error) || "Chỉ đổi được lịch đã công bố qua controlled-change, phiên đã hoàn thành không đổi được");
        return;
      }
      if (error.code === 409) {
        toast.error("Phiên vừa bị thay đổi bởi thao tác khác — tải lại rồi thử lại");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không tạo được thay đổi có kiểm soát"));
    },
  });
}

/** GET /sessions/{session_id}/replacement-suggestions */
export function useReplacementSuggestions(sessionId: number | null) {
  return useQuery({
    queryKey: managerKeys.replacementSuggestions(sessionId ?? 0),
    queryFn: () => fetchScheduling.replacementSuggestions(sessionId as number),
    enabled: sessionId !== null,
    staleTime: 15 * 1000,
  });
}

export function useSetResultOwner() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      versionId,
      sessionId,
      payload,
    }: {
      versionId: number;
      sessionId: number;
      roundId?: number;
      payload: ResultOwnerPayload;
    }) => fetchScheduling.setResultOwner(versionId, sessionId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã chỉ định Result Owner cho phiên");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Result Owner phải là một Reviewer của phiên"));
    },
  });
}

export function useSetH11Waiver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, groupId, payload }: { roundId: number; groupId: number; payload: H11WaiverPayload }) =>
      fetchScheduling.setH11Waiver(roundId, groupId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      toast.success("Đã gỡ ràng buộc H11 (giữ Chủ tịch) cho nhóm này");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gỡ được ràng buộc H11 — nhóm phải thuộc đợt này"));
    },
  });
}

export function useRemoveH11Waiver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, groupId }: { roundId: number; groupId: number }) =>
      fetchScheduling.removeH11Waiver(roundId, groupId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      toast.success("Đã khôi phục ràng buộc H11 cho nhóm này");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tìm thấy waiver để gỡ"));
    },
  });
}

export function usePostponeSession() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
      semesterId,
    }: {
      sessionId: number;
      roundId?: number;
      semesterId?: number | null;
      payload: PostponeSessionPayload;
    }) => fetchScheduling.postponeSession(sessionId, payload, semesterId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã hoãn phiên đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Chỉ hoãn được phiên đang SCHEDULED/ONGOING"));
    },
  });
}

export function useDecideRescheduleRequest() {
  const invalidate = useInvalidateAfterScheduleChange();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      semesterId,
    }: {
      requestId: number;
      roundId?: number;
      semesterId?: number | null;
      payload: RescheduleDecisionPayload;
    }) => fetchScheduling.decideRescheduleRequest(requestId, payload, semesterId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success(variables.payload.decision === "APPROVED" ? "Đã duyệt yêu cầu đổi lịch" : "Đã từ chối yêu cầu đổi lịch");
    },
    onError: (error: ApiError) => {
      if (error.code === 404) {
        toast.error("Yêu cầu không tồn tại hoặc đã được xử lý");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không xử lý được yêu cầu đổi lịch"));
    },
  });
}

export function useRoundOperation() {
  const invalidate = useInvalidateAfterScheduleChange();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: number; payload: RoundOperationPayload }) =>
      fetchScheduling.roundOperation(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
      toast.success(variables.payload.action === "POSTPONED" ? "Đã hoãn đợt đánh giá" : "Đã hủy đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không thực hiện được thao tác trên đợt đánh giá"));
    },
  });
}
