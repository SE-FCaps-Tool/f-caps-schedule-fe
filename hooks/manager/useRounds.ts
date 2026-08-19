"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchRounds,
  type AvailabilitySubmitPayload,
  type InvitationCreatePayload,
  type RoundConfigUpdatePayload,
  type RoundCreatePayload,
  type RoundDayCreatePayload,
  type RoundResourcesPayload,
  type RoundTransitionPayload,
} from "@/lib/api/services/fetchRounds";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /rounds?semester_id= (xem docs/manager-api.md §3/§8) */
export function useRounds(semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.rounds(semesterId),
    queryFn: () => fetchRounds.list(semesterId),
    staleTime: 30 * 1000,
  });
}

function useInvalidateRounds(roundId?: number) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
    if (roundId) await queryClient.invalidateQueries({ queryKey: managerKeys.round(roundId) });
  };
}

export function useCreateRound() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: (payload: RoundCreatePayload) => fetchRounds.create(payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo đợt đánh giá ${data.type} (DRAFT)`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được đợt đánh giá"));
    },
  });
}

export function useTransitionRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: number; payload: RoundTransitionPayload }) =>
      fetchRounds.transition(roundId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      toast.success("Đã chuyển trạng thái đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không chuyển được trạng thái — kiểm tra input còn thiếu (group/timeslot/room/availability)"));
    },
  });
}

export function useAddRoundDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: number; payload: RoundDayCreatePayload }) =>
      fetchRounds.addDay(roundId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundMyAvailability(variables.roundId) });
      toast.success("Đã thêm ngày/slot cho đợt đánh giá");
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Slot bị trùng trong ngày đã chọn");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không thêm được ngày/slot"));
    },
  });
}

export function useSetRoundResources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: number; payload: RoundResourcesPayload }) =>
      fetchRounds.setResources(roundId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      toast.success("Đã cập nhật nhóm/phòng/timeslot cho đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được tài nguyên đợt đánh giá"));
    },
  });
}

export function useInviteLecturers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: number; payload: InvitationCreatePayload }) =>
      fetchRounds.invite(roundId, payload),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundRegistration(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: [...managerKeys.round(variables.roundId), "invitations"] });
      toast.success(`Đã gửi lời mời tới ${data.invited_count} giảng viên`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gửi được lời mời"));
    },
  });
}

export function useSubmitLecturerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      lecturerId,
      payload,
    }: {
      roundId: number;
      lecturerId: number;
      payload: AvailabilitySubmitPayload;
    }) => fetchRounds.submitLecturerAvailability(roundId, lecturerId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundMyAvailability(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundRegistration(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: [...managerKeys.round(variables.roundId), "invitations"] });
      toast.success("Đã nhập lịch rảnh cho giảng viên");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không nhập được lịch rảnh"));
    },
  });
}

export function useSubmitGroupAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      groupId,
      payload,
    }: {
      roundId: number;
      groupId: number;
      payload: AvailabilitySubmitPayload;
    }) => fetchRounds.submitGroupAvailability(roundId, groupId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundMyAvailability(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: managerKeys.roundRegistration(variables.roundId) });
      await queryClient.invalidateQueries({ queryKey: [...managerKeys.round(variables.roundId), "groups"] });
      toast.success("Đã nhập lịch rảnh cho nhóm");
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Đợt chưa bật chế độ nhóm tự chọn slot");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không nhập được lịch rảnh"));
    },
  });
}

/** GET /rounds/{round_id}/registration — chỉ số đếm tổng, xem docs/manager-api.md §8.3/§8.4 */
export function useRoundRegistration(roundId: number | null) {
  return useQuery({
    queryKey: managerKeys.roundRegistration(roundId ?? 0),
    queryFn: () => fetchRounds.registration(roundId as number),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/{round_id}/my-availability — nguồn timeslot cho Calendar */
export function useRoundMyAvailability(roundId: number | null) {
  return useQuery({
    queryKey: managerKeys.roundMyAvailability(roundId ?? 0),
    queryFn: () => fetchRounds.myAvailability(roundId as number),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/{round_id}?semester_id= — resource-scope check theo manager-api.md §5 */
export function useRound(roundId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.round(roundId ?? 0),
    queryFn: () => fetchRounds.getById(roundId as number, semesterId),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/{round_id}/invitations?semester_id= — resource-scope check theo manager-api.md §5 */
export function useRoundInvitations(roundId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: [...managerKeys.round(roundId ?? 0), "invitations"] as const,
    queryFn: () => fetchRounds.invitations(roundId as number, semesterId),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/{round_id}/groups?semester_id= — resource-scope check theo manager-api.md §5 */
export function useRoundGroupRoster(roundId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: [...managerKeys.round(roundId ?? 0), "groups"] as const,
    queryFn: () => fetchRounds.groupRoster(roundId as number, semesterId),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** POST /rounds/{round_id}/invitations/{lecturer_id}/resend?semester_id= — manager-api.md §10.5 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      lecturerId,
      semesterId,
    }: {
      roundId: number;
      lecturerId: number;
      semesterId?: number | null;
    }) => fetchRounds.resendInvitation(roundId, lecturerId, semesterId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [...managerKeys.round(variables.roundId), "invitations"] });
      toast.success("Đã gửi nhắc nhở tới giảng viên");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gửi được nhắc nhở"));
    },
  });
}

/**
 * PATCH /rounds/{round_id}?semester_id= — manager-api.md §10.4.
 * Chỉ cho sửa khi round là DRAFT hoặc OPEN_REGISTRATION.
 */
export function useUpdateRoundConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      payload,
      semesterId,
    }: {
      roundId: number;
      payload: RoundConfigUpdatePayload;
      semesterId?: number | null;
    }) => fetchRounds.updateConfig(roundId, payload, semesterId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
      await queryClient.invalidateQueries({ queryKey: managerKeys.round(variables.roundId) });
      toast.success("Đã cập nhật cấu hình đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được cấu hình — chỉ sửa được khi đợt còn Nháp/Đang mở đăng ký"));
    },
  });
}
