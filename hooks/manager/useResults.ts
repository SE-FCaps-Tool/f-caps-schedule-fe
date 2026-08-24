"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchResults,
  type OverdueFailPayload,
  type ResultPayload,
  type SubmitSessionResultPayload,
  type VerifyRemediationPayload,
} from "@/lib/api/services/fetchResults";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { detailMessage, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /sessions/{session_id}/result?semester_id= */
export function useSessionResult(sessionId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.sessionResult(sessionId ?? 0),
    queryFn: () => fetchResults.sessionResult(sessionId as number, semesterId),
    enabled: sessionId !== null,
    staleTime: Infinity,
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
      semesterId,
    }: {
      sessionId: number;
      payload: ResultPayload;
      semesterId?: number | null;
    }) => fetchResults.submitResult(sessionId, payload, semesterId),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.sessionResult(variables.sessionId) });
      await queryClient.invalidateQueries({ queryKey: managerKeys.remediation });
      await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "reports"] });
      toast.success(`Đã ghi kết quả — nhóm chuyển trạng thái ${data.groupStatus}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error(detailMessage(error) || "Kết quả không hợp lệ (thiếu hạn/verifier khắc phục, hoặc round không cho phép remediation)");
        return;
      }
      if (error.code === 403) {
        toast.error("Bạn không phải Reviewer/Result Owner được assign cho phiên này");
        return;
      }
      if (error.code === 409) {
        toast.error("Kết quả vừa bị thay đổi bởi thao tác khác — tải lại rồi thử lại");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không ghi được kết quả"));
    },
  });
}

/** GET /remediation — Manager thấy tất cả case */
export function useRemediationCases() {
  return useQuery({
    queryKey: managerKeys.remediation,
    queryFn: fetchResults.remediation,
    staleTime: Infinity,
  });
}

export function useOverdueFailRemediation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, payload }: { caseId: number; payload: OverdueFailPayload }) =>
      fetchResults.overdueFail(caseId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: managerKeys.remediation });
      await queryClient.invalidateQueries({ queryKey: ["manager", "reports"] });
      toast.success("Đã đánh dấu FAILED do quá hạn khắc phục");
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error("Case chưa quá hạn khắc phục");
        return;
      }
      if (error.code === 409) {
        toast.error("Case đã được xử lý trước đó");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không đánh dấu được FAILED"));
    },
  });
}

/** POST /sessions/:sessionId/result — spec §74. BE tự transition ProjectStatus */
export function useSubmitSessionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SubmitSessionResultPayload }) =>
      fetchResults.submitSessionResult(sessionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "project"] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
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

/** POST /remediations/:remediationId/verify — spec §76 */
export function useVerifyRemediation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ remediationId, payload }: { remediationId: string; payload: VerifyRemediationPayload }) =>
      fetchResults.verifyRemediation(remediationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "project"] });
      toast.success("Đã xác nhận kết quả khắc phục");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không xác nhận được kết quả khắc phục"));
    },
  });
}
