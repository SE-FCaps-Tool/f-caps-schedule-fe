"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchRounds,
  type AttachRoundResourcesPayload,
  type InviteLecturersPayload,
  type RoundCreatePayload,
  type RoundUpdatePayload,
} from "@/lib/api/services/fetchRounds";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /semesters/:semesterId/rounds — spec §19 */
export function useRounds(semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.rounds(semesterId),
    queryFn: () => fetchRounds.list(String(semesterId)),
    enabled: semesterId != null,
    staleTime: 30 * 1000,
  });
}

function useInvalidateRounds() {
  const queryClient = useQueryClient();
  return async (roundId?: string) => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "rounds"] });
    if (roundId) await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId] });
  };
}

/** POST /semesters/:semesterId/rounds — spec §20/§49, days[].slots[] gửi ngay trong request tạo */
export function useCreateRound(semesterId?: number | null) {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: (payload: RoundCreatePayload) => fetchRounds.create(String(semesterId), payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo đợt đánh giá ${data.name} (Nháp)`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được đợt đánh giá"));
    },
  });
}

/** POST /rounds/:roundId/actions/open-registration — spec §21/§51 */
export function useOpenRoundRegistration() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: (roundId: string) => fetchRounds.openRegistration(roundId),
    onSuccess: async (_data, roundId) => {
      await invalidate(roundId);
      toast.success("Đã mở đăng ký cho đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không mở được đăng ký — kiểm tra timeslot/loại phòng đã cấu hình"));
    },
  });
}

/** POST /rounds/:roundId/actions/open-group-registration — khóa Lecturer, mở Leader. */
export function useOpenGroupRegistration() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: (roundId: string) => fetchRounds.openGroupRegistration(roundId),
    onSuccess: async (_data, roundId) => {
      await invalidate(roundId);
      toast.success("Đã chuyển sang đăng ký lịch cho sinh viên");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không chuyển được sang đăng ký sinh viên"));
    },
  });
}

/** POST /rounds/:roundId/actions/close-registration — spec §21/§52 */
export function useCloseRoundRegistration() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: (roundId: string) => fetchRounds.closeRegistration(roundId),
    onSuccess: async (_data, roundId) => {
      await invalidate(roundId);
      toast.success("Đã đóng đăng ký cho đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đóng được đăng ký"));
    },
  });
}

/** GET /rounds/:roundId — spec §21/§50 */
export function useRoundDetail(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId] as const,
    queryFn: () => fetchRounds.getById(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/:roundId/invitations — spec §22 */
export function useRoundInvitations(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "invitations"] as const,
    queryFn: () => fetchRounds.invitations(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** POST /rounds/:roundId/invitations — spec §22/§53 */
export function useInviteLecturers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: InviteLecturersPayload }) =>
      fetchRounds.invite(roundId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "round", variables.roundId, "invitations"] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "round", variables.roundId, "registration-summary"] });
      toast.success(`Đã gửi lời mời tới ${variables.payload.lecturerIds.length} giảng viên`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gửi được lời mời"));
    },
  });
}

/** POST /rounds/:roundId/invitations/:invitationId/remind — spec §22 */
export function useRemindInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, invitationId }: { roundId: string; invitationId: string }) =>
      fetchRounds.remindInvitation(roundId, invitationId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "round", variables.roundId, "invitations"] });
      toast.success("Đã gửi nhắc nhở tới giảng viên");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gửi được nhắc nhở"));
    },
  });
}

/** GET /rounds/:roundId/eligible-projects — spec §23/§48 */
export function useEligibleProjects(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "eligible-projects"] as const,
    queryFn: () => fetchRounds.eligibleProjects(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** POST /rounds/:roundId/resources — Manager gắn nhóm đủ điều kiện vào Round. */
export function useAttachRoundResources() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: AttachRoundResourcesPayload }) =>
      fetchRounds.attachResources(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã gắn nhóm vào đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gắn được nhóm vào đợt đánh giá"));
    },
  });
}

/** GET /rounds/:roundId/registration-summary — spec §24 */
export function useRegistrationSummary(roundId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "registration-summary"] as const,
    queryFn: () => fetchRounds.registrationSummary(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/{round_id}/my-availability — nguồn timeslot cho Calendar (Phase 4, chưa migrate) */
export function useRoundMyAvailability(roundId: number | null) {
  return useQuery({
    queryKey: managerKeys.roundMyAvailability(roundId ?? 0),
    queryFn: () => fetchRounds.myAvailability(roundId as number),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** PATCH /rounds/:roundId — sửa cấu hình khi Round còn DRAFT/OPEN_REGISTRATION (BE checklist A2) */
export function useUpdateRound() {
  const invalidate = useInvalidateRounds();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: RoundUpdatePayload }) =>
      fetchRounds.update(roundId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.roundId);
      toast.success("Đã cập nhật cấu hình đợt đánh giá");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được cấu hình"));
    },
  });
}
// Cũng bỏ hẳn "nhập lịch rảnh hộ" (useSubmitLecturerAvailability/useSubmitGroupAvailability cũ)
// — spec chỉ có PUT /rounds/:roundId/availability/me và .../groups/:groupId/preferences (self-service
// của Lecturer/Leader), không có endpoint nào cho Manager nhập hộ.
