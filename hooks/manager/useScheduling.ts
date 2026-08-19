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
  type ChangeRoomPayload,
  type ReplaceReviewerPayload,
  type PostponeRoundSessionPayload,
  type CreateMakeupSessionPayload,
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

// --- Phase 4 (spec §25/§26/§57/§58/§64) — tên riêng, xem ghi chú đầu fetchScheduling.ts ---

/** GET /rounds/:roundId/scheduling-readiness — spec §25/§57 */
export function useSchedulingReadiness(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "scheduling-readiness"] as const,
    queryFn: () => fetchScheduling.readiness(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/:roundId/schedules — spec §26 */
export function useRoundScheduleVersions(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "schedules"] as const,
    queryFn: () => fetchScheduling.roundScheduleVersions(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

function useInvalidateRoundSchedules() {
  const queryClient = useQueryClient();
  return async (roundId: string) => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId, "schedules"] });
    await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId] });
  };
}

/** POST /rounds/:roundId/schedules/generate — spec §58. Partial solution vẫn lưu DRAFT (spec §62) */
export function useGenerateSchedule() {
  const invalidate = useInvalidateRoundSchedules();

  return useMutation({
    mutationFn: (roundId: string) => fetchScheduling.generate(roundId),
    onSuccess: async (data, roundId) => {
      await invalidate(roundId);
      toast.success(
        data.unscheduledCount > 0
          ? `Đã xếp lịch: ${data.scheduledCount} nhóm xếp được, ${data.unscheduledCount} nhóm chưa xếp được`
          : `Đã xếp lịch đủ ${data.scheduledCount} nhóm`
      );
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không chạy được thuật toán xếp lịch"));
    },
  });
}

/** POST /rounds/:roundId/schedules/:versionId/actions/set-active — spec §26/§64 */
export function useSetActiveScheduleVersion() {
  const invalidate = useInvalidateRoundSchedules();

  return useMutation({
    mutationFn: ({ roundId, versionId }: { roundId: string; versionId: string }) =>
      fetchScheduling.setActiveVersion(roundId, versionId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã kích hoạt phương án lịch — đợt chuyển sang Đã xếp lịch");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không kích hoạt được phương án lịch"));
    },
  });
}

/** POST /rounds/:roundId/schedules/:versionId/actions/discard — spec §26 */
export function useDiscardScheduleVersion() {
  const invalidate = useInvalidateRoundSchedules();

  return useMutation({
    mutationFn: ({ roundId, versionId }: { roundId: string; versionId: string }) =>
      fetchScheduling.discardVersion(roundId, versionId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã loại bỏ phương án lịch");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không loại bỏ được phương án lịch"));
    },
  });
}

/** GET /rounds/:roundId/publish-readiness — spec §29/§69 */
export function usePublishReadiness(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "publish-readiness"] as const,
    queryFn: () => fetchScheduling.publishReadiness(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** POST /rounds/:roundId/actions/publish — spec §29/§70 */
export function usePublishRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roundId: string) => fetchScheduling.publishRound(roundId),
    onSuccess: async (_data, roundId) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
      toast.success("Đã công bố lịch cho đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không công bố được lịch — kiểm tra điều kiện publish"));
    },
  });
}

// --- Phase 7 (spec §71-73) — post-publish, thao tác theo từng Session ---

function useInvalidateSession(roundId: string, versionId: string | null) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId, "sessions", versionId] });
  };
}

/** POST /sessions/:sessionId/actions/change-room — spec §71 */
export function useChangeSessionRoom(roundId: string, versionId: string | null) {
  const invalidate = useInvalidateSession(roundId, versionId);

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: ChangeRoomPayload }) =>
      fetchScheduling.changeSessionRoom(sessionId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã đổi phòng cho phiên đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đổi được phòng — kiểm tra xung đột cùng timeslot"));
    },
  });
}

/** POST /sessions/:sessionId/actions/replace-reviewer — spec §72. Council cũ giữ nguyên, tạo Council mới */
export function useReplaceSessionReviewer(roundId: string, versionId: string | null) {
  const invalidate = useInvalidateSession(roundId, versionId);

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: ReplaceReviewerPayload }) =>
      fetchScheduling.replaceSessionReviewer(sessionId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã thay reviewer cho phiên đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không thay được reviewer — kiểm tra lịch rảnh/COI/hạn mức"));
    },
  });
}

/** POST /sessions/:sessionId/actions/postpone — spec §73. Session gốc giữ nguyên, chỉ đổi status */
export function usePostponeRoundSession(roundId: string, versionId: string | null) {
  const invalidate = useInvalidateSession(roundId, versionId);

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: PostponeRoundSessionPayload }) =>
      fetchScheduling.postponeRoundSession(sessionId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã hoãn phiên đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không hoãn được phiên đánh giá"));
    },
  });
}

/** POST /sessions/:sessionId/makeup — spec §73 */
export function useCreateMakeupSession(roundId: string, versionId: string | null) {
  const invalidate = useInvalidateSession(roundId, versionId);

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: CreateMakeupSessionPayload }) =>
      fetchScheduling.createMakeupSession(sessionId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã tạo buổi bù");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được buổi bù"));
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
