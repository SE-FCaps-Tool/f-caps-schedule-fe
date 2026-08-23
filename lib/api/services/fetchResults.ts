import apiService from "../core";

/**
 * Phần dưới đây theo capstone-fe-be-implementation-spec.md §9/§74/§76 (Phase 8 — Result &
 * Progression). Đặt tên riêng, không sửa các export cũ bên dưới — `results-page.tsx` hiện tại
 * (danh sách case khắc phục + overdue-fail) không có endpoint tương ứng trong spec mới (xem
 * ghi chú trong docs/manager-fe-migration-phases.md Phase 8), nên giữ nguyên cho tới khi BE
 * xác nhận có/không có màn hình đó.
 */

export type ReviewResult = "PASS" | "NEEDS_FIX" | "FAIL";
export type Review3Result = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
/** @deprecated Use Review3Result for the renamed REVIEW_3 round. */
export type DefenseResult = Review3Result;
export type Defense1Result = "COMPLETED";
export type Defense2Result = "PASS" | "FAIL";
export type RoundResult = ReviewResult | Review3Result | Defense1Result | Defense2Result;

export interface SubmitReviewResultPayload {
  result: ReviewResult;
  note?: string;
}

export interface SubmitDefenseResultPayload {
  result: Review3Result;
  note?: string;
  /** Bắt buộc khi result = LEVEL_2 (spec §74) */
  remediation?: {
    deadline: string;
    verifierId: string;
  };
}

export interface SubmitDefense1ResultPayload {
  result: Defense1Result;
  note?: string;
}

export interface SubmitDefense2ResultPayload {
  result: Defense2Result;
  note?: string;
}

export type SubmitSessionResultPayload =
  | SubmitReviewResultPayload
  | SubmitDefenseResultPayload
  | SubmitDefense1ResultPayload
  | SubmitDefense2ResultPayload;

/** spec §76 — Manager/Lecturer xác nhận case khắc phục. PASS: D12_CONDITIONAL → ELIGIBLE_D12 */
export interface VerifyRemediationPayload {
  decision: "PASS" | "FAIL";
  note?: string;
}

export type ResultOutcome = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "PASSED" | "COMPLETED" | string;

export interface SessionResultDetail {
  id: number;
  sessionId: number;
  outcome: ResultOutcome;
  note: string | null;
  enteredBy: number;
  enteredAt: string;
  correctionReason: string | null;
  remediationDueAt: string | null;
  verifierLecturerId: number | null;
  verifyStatus: string | null;
  beforeGroupStatus: string;
  afterGroupStatus: string;
}

export interface SessionResultResponse {
  sessionId: number;
  roundType: string;
  groupStatus: string;
  result: SessionResultDetail | null;
}

export interface ResultPayload {
  outcome: string;
  note?: string;
  remediation_due_at?: string | null;
  verifier_lecturer_id?: number | null;
  correction_reason?: string | null;
}

export interface ResultSubmitResponse {
  id: number;
  sessionId: number;
  outcome: string;
  groupStatus: string;
}

export type RemediationStatus = "OPEN" | "OVERDUE" | "PASSED" | "FAILED";

export interface RemediationCase {
  id: number;
  groupId: number;
  groupCode: string;
  status: RemediationStatus;
  dueAt: string;
  verifierLecturerId: number | null;
  note: string | null;
  roundType: string;
}

export interface OverdueFailPayload {
  reason: string;
}

export interface OverdueFailResponse {
  id: number;
  status: "FAILED";
}

export const fetchResults = {
  /** GET /sessions/{session_id}/result?semester_id= — tất cả role, chỉ trong scope actor */
  sessionResult: async (sessionId: number, semesterId?: number | null): Promise<SessionResultResponse> => {
    const response = await apiService.get<SessionResultResponse, { semesterId?: number }>(
      `api/v1/sessions/${sessionId}/result`,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /**
   * POST /sessions/{session_id}/result?semester_id= — MANAGER, LECTURER.
   * D1.1 outcome LEVEL_2 bắt buộc remediation_due_at + verifier_lecturer_id (mục 8.3 Business Rules).
   * Sửa result đã tồn tại: chỉ Manager, bắt buộc correction_reason.
   */
  submitResult: async (
    sessionId: number,
    payload: ResultPayload,
    semesterId?: number | null
  ): Promise<ResultSubmitResponse> => {
    const response = await apiService.post<ResultSubmitResponse, ResultPayload, { semesterId?: number }>(
      `api/v1/sessions/${sessionId}/result`,
      payload,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /**
   * GET /remediation — tất cả role, Manager thấy tất cả case.
   * BE có thể trả mảng phẳng HOẶC `{data: [...], meta}` qua success_payload() tuỳ đã migrate
   * hay chưa (xem docs/be-checklist-open-questions.md mục 6) — chấp nhận cả 2 dạng cho an toàn.
   * `normalizeToSnakeCase` không đổi gì nếu field đã là snake_case, nên áp dụng vô điều kiện
   * không rủi ro.
   */
  remediation: async (): Promise<RemediationCase[]> => {
    const response = await apiService.get<unknown>("api/v1/remediation");
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: unknown[] }).data
        : [];
    return list as RemediationCase[];
  },

  /**
   * POST /remediation/{case_id}/overdue-fail — MANAGER only.
   * Chỉ fail case OPEN/OVERDUE sau khi đã quá due_at — bán tự động theo BR-REM-04.
   */
  overdueFail: async (caseId: number, payload: OverdueFailPayload): Promise<OverdueFailResponse> => {
    const response = await apiService.post<OverdueFailResponse, OverdueFailPayload>(
      `api/v1/remediation/${caseId}/overdue-fail`,
      payload
    );
    return response.data;
  },

  /** POST /sessions/:sessionId/result — spec §74. BE tự transition ProjectStatus, FE chỉ refetch */
  submitSessionResult: async (sessionId: string, payload: SubmitSessionResultPayload): Promise<void> => {
    await apiService.post(`api/v1/sessions/${sessionId}/result`, payload);
  },

  /** POST /remediations/:remediationId/verify — spec §76 */
  verifyRemediation: async (remediationId: string, payload: VerifyRemediationPayload): Promise<void> => {
    await apiService.post(`api/v1/remediations/${remediationId}/verify`, payload);
  },
};
