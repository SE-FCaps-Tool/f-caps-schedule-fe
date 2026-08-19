import apiService from "../core";

export type ResultOutcome = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "PASSED" | "COMPLETED" | string;

export interface SessionResultDetail {
  id: number;
  session_id: number;
  outcome: ResultOutcome;
  note: string | null;
  entered_by: number;
  entered_at: string;
  correction_reason: string | null;
  remediation_due_at: string | null;
  verifier_lecturer_id: number | null;
  verify_status: string | null;
  before_group_status: string;
  after_group_status: string;
}

export interface SessionResultResponse {
  session_id: number;
  round_type: string;
  group_status: string;
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
  session_id: number;
  outcome: string;
  group_status: string;
}

export type RemediationStatus = "OPEN" | "OVERDUE" | "PASSED" | "FAILED";

export interface RemediationCase {
  id: number;
  group_id: number;
  group_code: string;
  status: RemediationStatus;
  due_at: string;
  verifier_lecturer_id: number | null;
  note: string | null;
  round_type: string;
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
    const response = await apiService.get<SessionResultResponse>(`api/v1/sessions/${sessionId}/result`, {
      semester_id: semesterId ?? undefined,
    });
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
    const response = await apiService.post<ResultSubmitResponse>(
      `api/v1/sessions/${sessionId}/result`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /remediation — tất cả role, Manager thấy tất cả case */
  remediation: async (): Promise<RemediationCase[]> => {
    const response = await apiService.get<RemediationCase[]>("api/v1/remediation");
    return response.data;
  },

  /**
   * POST /remediation/{case_id}/overdue-fail — MANAGER only.
   * Chỉ fail case OPEN/OVERDUE sau khi đã quá due_at — bán tự động theo BR-REM-04.
   */
  overdueFail: async (caseId: number, payload: OverdueFailPayload): Promise<OverdueFailResponse> => {
    const response = await apiService.post<OverdueFailResponse>(
      `api/v1/remediation/${caseId}/overdue-fail`,
      payload
    );
    return response.data;
  },
};
