"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchLecturerPortal,
  type RespondInvitationPayload,
  type SubmitAvailabilityPayload,
  type MySessionsParams,
} from "@/lib/api/services/fetchLecturerPortal";
import { fetchResults, type SubmitSessionResultPayload, type VerifyRemediationPayload } from "@/lib/api/services/fetchResults";
import { friendlyErrorMessage, detailMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /lecturer/me/invitations — spec §31 */
export function useLecturerInvitations() {
  return useQuery({
    queryKey: ["lecturer", "invitations"] as const,
    queryFn: fetchLecturerPortal.invitations,
    staleTime: 15 * 1000,
  });
}

/** POST /rounds/:roundId/invitations/me/respond — spec §31/§54 */
export function useRespondInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, payload }: { roundId: string; payload: RespondInvitationPayload }) =>
      fetchLecturerPortal.respondInvitation(roundId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "invitations"] });
      toast.success(variables.payload.decision === "ACCEPTED" ? "Đã nhận lời mời" : "Đã từ chối lời mời");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gửi được phản hồi"));
    },
  });
}

/** GET /rounds/:roundId/availability/me — spec §32/§55 */
export function useLecturerAvailability(roundId: string | null) {
  return useQuery({
    queryKey: ["lecturer", "availability", roundId] as const,
    queryFn: () => fetchLecturerPortal.availability(roundId as string),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** PUT /rounds/:roundId/availability/me — spec §32/§55 */
export function useSubmitAvailability(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitAvailabilityPayload) => fetchLecturerPortal.submitAvailability(roundId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "availability", roundId] });
      toast.success("Đã lưu lịch rảnh");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không lưu được lịch rảnh — kiểm tra đợt còn mở đăng ký và bạn đã nhận lời mời"));
    },
  });
}

/** GET /lecturer/me/sessions — spec §33 */
export function useLecturerSessions(params: MySessionsParams = {}) {
  return useQuery({
    queryKey: ["lecturer", "sessions", params] as const,
    queryFn: () => fetchLecturerPortal.mySessions(params),
    staleTime: 15 * 1000,
  });
}

/** GET /lecturer/me/supervised-projects — spec §34 */
export function useSupervisedProjects() {
  return useQuery({
    queryKey: ["lecturer", "supervised-projects"] as const,
    queryFn: fetchLecturerPortal.supervisedProjects,
    staleTime: 15 * 1000,
  });
}

/** GET /lecturer/me/remediations — spec §36 */
export function useLecturerRemediations() {
  return useQuery({
    queryKey: ["lecturer", "remediations"] as const,
    queryFn: fetchLecturerPortal.remediations,
    staleTime: 15 * 1000,
  });
}

/** POST /remediations/:remediationId/verify — spec §36/§76, scope Lecturer */
export function useVerifyLecturerRemediation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ remediationId, payload }: { remediationId: string; payload: VerifyRemediationPayload }) =>
      fetchResults.verifyRemediation(remediationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "remediations"] });
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "supervised-projects"] });
      toast.success("Đã xác nhận kết quả khắc phục");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không xác nhận được kết quả khắc phục"));
    },
  });
}

/** GET /sessions/:sessionId — spec §35 */
export function useLecturerSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["lecturer", "session", sessionId] as const,
    queryFn: () => fetchLecturerPortal.sessionDetail(sessionId as string),
    enabled: sessionId !== null,
    staleTime: 15 * 1000,
  });
}

/** POST /sessions/:sessionId/result — spec §35/§74, scope Lecturer */
export function useSubmitLecturerSessionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SubmitSessionResultPayload }) =>
      fetchResults.submitSessionResult(sessionId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["lecturer", "session", variables.sessionId] });
      toast.success("Đã ghi kết quả");
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error(detailMessage(error) || "Thiếu hạn khắc phục hoặc người xác minh cho mức LEVEL_2");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không ghi được kết quả"));
    },
  });
}
