import apiService from "../core";

export type ScheduleVersionStatus = "VALID" | "PUBLISHED" | "SUPERSEDED";
export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "POSTPONED";

export interface ScheduleRunPayload {
  random_seed?: number;
  time_limit_seconds?: number;
}

export interface UnscheduledGroupReason {
  group_id: number;
  group_code?: string;
  reason: string;
  [key: string]: unknown;
}

export interface ScheduleRunResponse {
  version_id: number;
  status: string;
  scheduled_count: number;
  unscheduled: UnscheduledGroupReason[];
  soft_scores: Record<string, number>;
}

export interface ScheduleVersionSummary {
  id: number;
  round_id: number;
  version_no: number;
  status: ScheduleVersionStatus;
  /** manager-api.md §10.9 — trạng thái hiển thị (khác `status` nghiệp vụ) */
  ui_status: string;
  /** manager-api.md §10.9 */
  is_active: boolean;
  solver_status: string;
  total_score: number | null;
  soft_scores: Record<string, number>;
  random_seed: number;
  created_at: string;
  activated_at: string | null;
}

export interface ScheduleSession {
  id: number;
  group_id: number;
  group_code: string;
  project_id: number;
  timeslot_id: number;
  room_id: number;
  start_at: string;
  end_at: string;
  status: SessionStatus;
  reviewer_ids: number[];
  result_owner_ids: number[];
  reviewer_names: Record<string, string>;
}

export interface ScheduleVersionDetail extends ScheduleVersionSummary {
  sessions: ScheduleSession[];
}

export interface ActivateVersionResponse {
  version_id: number;
  status: ScheduleVersionStatus;
}

export interface PublishVersionResponse {
  round_id: number;
  version_id: number;
  status: "PUBLISHED";
  recipient_count: number;
}

export interface SessionEditPayload {
  timeslot_id?: number;
  room_id?: number;
  reviewer_ids?: number[];
  result_owner_id?: number;
  reason: string;
}

export interface SessionEditResponse {
  session_id: number;
  version_id: number;
  status: "UPDATED";
}

export interface ControlledChangeResponse {
  version_id: number;
  source_version_id: number;
  session_id: number;
  status: "VALID";
}

export interface ReplacementSuggestion {
  timeslot_id: number;
  room_id: number;
  reviewer_ids: number[];
  replaces: number[];
}

export interface ResultOwnerPayload {
  lecturer_id: number;
}

export interface ResultOwnerResponse {
  version_id: number;
  session_id: number;
  result_owner_id: number;
}

export interface H11WaiverPayload {
  reason: string;
}

export interface H11WaiverResponse {
  id: number;
  round_id: number;
  group_id: number;
  active: boolean;
}

export interface PostponeSessionPayload {
  reason: string;
}

export interface PostponeSessionResponse {
  id: number;
  status: "POSTPONED";
}

export interface RescheduleDecisionPayload {
  decision: "APPROVED" | "REJECTED";
  note: string;
}

export interface RescheduleDecisionResponse {
  id: number;
  status: string;
  decision_note: string;
}

export interface RoundOperationPayload {
  action: "POSTPONED" | "CANCELLED";
  reason: string;
}

export interface RoundOperationResponse {
  round_id: number;
  status: string;
}

export interface DeleteVersionResponse {
  version_id: number;
  deleted: true;
}

export const fetchScheduling = {
  /** POST /rounds/{round_id}/schedule/run?semester_id= — ADMIN, MANAGER. Có thể chạy nhiều lần (BR-SCH-01) */
  run: async (
    roundId: number,
    payload: ScheduleRunPayload = {},
    semesterId?: number | null
  ): Promise<ScheduleRunResponse> => {
    const response = await apiService.post<ScheduleRunResponse>(
      `api/v1/rounds/${roundId}/schedule/run`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /rounds/{round_id}/schedule/versions?semester_id= — tất cả role, Manager thấy mọi version */
  versions: async (roundId: number, semesterId?: number | null): Promise<ScheduleVersionSummary[]> => {
    const response = await apiService.get<ScheduleVersionSummary[]>(
      `api/v1/rounds/${roundId}/schedule/versions`,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /schedule/versions/{version_id}?semester_id= — nguồn dữ liệu chính cho Calendar */
  versionDetail: async (versionId: number, semesterId?: number | null): Promise<ScheduleVersionDetail> => {
    const response = await apiService.get<ScheduleVersionDetail>(`api/v1/schedule/versions/${versionId}`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** POST /schedule/versions/{version_id}/activate?semester_id= — ADMIN, MANAGER. Chỉ version VALID */
  activate: async (versionId: number, semesterId?: number | null): Promise<ActivateVersionResponse> => {
    const response = await apiService.post<ActivateVersionResponse>(
      `api/v1/schedule/versions/${versionId}/activate`,
      undefined,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/schedule/publish/{version_id}?semester_id= — ADMIN, MANAGER */
  publish: async (
    roundId: number,
    versionId: number,
    semesterId?: number | null
  ): Promise<PublishVersionResponse> => {
    const response = await apiService.post<PublishVersionResponse>(
      `api/v1/rounds/${roundId}/schedule/publish/${versionId}`,
      undefined,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /**
   * POST /schedule/versions/{version_id}/sessions/{session_id}/edit?semester_id= — ADMIN, MANAGER.
   * Chỉ sửa version VALID hiện tại (draft-edit, trước khi publish).
   */
  editSession: async (
    versionId: number,
    sessionId: number,
    payload: SessionEditPayload,
    semesterId?: number | null
  ): Promise<SessionEditResponse> => {
    const response = await apiService.post<SessionEditResponse>(
      `api/v1/schedule/versions/${versionId}/sessions/${sessionId}/edit`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /**
   * POST /schedule/versions/{version_id}/sessions/{session_id}/controlled-change?semester_id= — ADMIN, MANAGER.
   * Chỉ dùng cho version đã PUBLISHED — tạo version VALID mới, không mutate version published.
   */
  controlledChangeSession: async (
    versionId: number,
    sessionId: number,
    payload: SessionEditPayload,
    semesterId?: number | null
  ): Promise<ControlledChangeResponse> => {
    const response = await apiService.post<ControlledChangeResponse>(
      `api/v1/schedule/versions/${versionId}/sessions/${sessionId}/controlled-change`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** DELETE /schedule/versions/{version_id}?semester_id= — ADMIN, MANAGER. 409 nếu version có dependency */
  deleteVersion: async (versionId: number, semesterId?: number | null): Promise<DeleteVersionResponse> => {
    const response = await apiService.delete<DeleteVersionResponse>(`api/v1/schedule/versions/${versionId}`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /sessions/{session_id}/replacement-suggestions — ADMIN, MANAGER. Tối đa 50 item */
  replacementSuggestions: async (sessionId: number): Promise<ReplacementSuggestion[]> => {
    const response = await apiService.get<ReplacementSuggestion[]>(
      `api/v1/sessions/${sessionId}/replacement-suggestions`
    );
    return response.data;
  },

  /**
   * POST /schedule/versions/{version_id}/sessions/{session_id}/result-owner — MANAGER only.
   * Chỉ khi round bật result_owner_mode và type DEFENSE_1_1/DEFENSE_2.
   */
  setResultOwner: async (
    versionId: number,
    sessionId: number,
    payload: ResultOwnerPayload
  ): Promise<ResultOwnerResponse> => {
    const response = await apiService.post<ResultOwnerResponse>(
      `api/v1/schedule/versions/${versionId}/sessions/${sessionId}/result-owner`,
      payload
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/groups/{group_id}/h11-waiver — MANAGER only. Gỡ H11 theo từng nhóm */
  setH11Waiver: async (
    roundId: number,
    groupId: number,
    payload: H11WaiverPayload
  ): Promise<H11WaiverResponse> => {
    const response = await apiService.post<H11WaiverResponse>(
      `api/v1/rounds/${roundId}/groups/${groupId}/h11-waiver`,
      payload
    );
    return response.data;
  },

  /** DELETE /rounds/{round_id}/groups/{group_id}/h11-waiver — MANAGER only */
  removeH11Waiver: async (roundId: number, groupId: number): Promise<H11WaiverResponse> => {
    const response = await apiService.delete<H11WaiverResponse>(
      `api/v1/rounds/${roundId}/groups/${groupId}/h11-waiver`
    );
    return response.data;
  },

  /** POST /sessions/{session_id}/postpone?semester_id= — ADMIN, MANAGER. Chỉ session SCHEDULED/ONGOING */
  postponeSession: async (
    sessionId: number,
    payload: PostponeSessionPayload,
    semesterId?: number | null
  ): Promise<PostponeSessionResponse> => {
    const response = await apiService.post<PostponeSessionResponse>(
      `api/v1/sessions/${sessionId}/postpone`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /reschedule-requests/{request_id}/decision?semester_id= — ADMIN, MANAGER. Chỉ request đang REQUESTED */
  decideRescheduleRequest: async (
    requestId: number,
    payload: RescheduleDecisionPayload,
    semesterId?: number | null
  ): Promise<RescheduleDecisionResponse> => {
    const response = await apiService.post<RescheduleDecisionResponse>(
      `api/v1/reschedule-requests/${requestId}/decision`,
      payload,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/operation — ADMIN, MANAGER. action: POSTPONED | CANCELLED */
  roundOperation: async (roundId: number, payload: RoundOperationPayload): Promise<RoundOperationResponse> => {
    const response = await apiService.post<RoundOperationResponse>(
      `api/v1/rounds/${roundId}/operation`,
      payload
    );
    return response.data;
  },
};
