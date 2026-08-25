import apiService from "../core";

export type ScheduleVersionStatus = "DRAFT" | "VALID" | "ACTIVE" | "PUBLISHED" | "SUPERSEDED";
export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "POSTPONED";

/**
 * Phần dưới đây theo capstone-fe-be-implementation-spec.md §25/§26/§57/§58/§62-64 (Phase 4 —
 * Scheduling/CP-SAT). Đặt tên khác các export cũ ở trên (`versions`, `activate`, `run`...) vì
 * `calendar-page.tsx` (Phase 5, chưa migrate — cần Room tồn tại trước) vẫn đang gọi các hàm cũ
 * với shape cũ; không đổi tên tại chỗ để tránh vỡ trang đó giữa chừng.
 */

/** spec §6 — DRAFT → ACTIVE → PUBLISHED, hoặc DISCARDED. Khác VALID/PUBLISHED/SUPERSEDED cũ */
export type RoundScheduleVersionStatus = "DRAFT" | "ACTIVE" | "PUBLISHED" | "DISCARDED";

export interface SchedulingReadiness {
  ready: boolean;
  counts: { eligibleProjects: number; availableLecturers: number; timeslots: number };
  blockingIssues: string[];
  warnings: { code: string; count: number }[];
}

/** spec §62 — lý do một Group không xếp được lịch trong lần chạy solver gần nhất */
export type UnscheduledReason =
  | "NO_VALID_TIMESLOT"
  | "NO_ENOUGH_ELIGIBLE_REVIEWERS"
  | "SUPERVISOR_CONFLICT"
  | "COI_CONFLICT"
  | "LECTURER_AVAILABILITY_TOO_LOW"
  | "GROUP_PREFERENCE_TOO_NARROW"
  | "QUOTA_EXCEEDED"
  | "TIMESLOT_CAPACITY_REACHED"
  | "CONTINUITY_CONSTRAINT_FAILED";

export interface GenerateScheduleResult {
  versionId: string;
  versionNumber: number;
  status: RoundScheduleVersionStatus;
  scheduledCount: number;
  unscheduledCount: number;
  /**
   * S1..S9 thô từ BE (scheduler.py) — không tự suy diễn "overall score": S1 (workload) và S3
   * (continuity, chỉ áp dụng cho DEFENSE_1, luôn 0 với round type khác) là điểm số, còn S4/S5
   * là cờ nhị phân (vd S4 = buổi sáng hay không) — cộng chung các giá trị này không ra một con
   * số có ý nghĩa. BE cũng không trả total_score thật ở endpoint này (chỉ lưu trong DB, đọc qua
   * `RoundScheduleVersionItem.overallScore`/`roundScheduleVersions()` bên dưới).
   */
  softScores: Record<string, number>;
}

export interface RoundScheduleVersionItem {
  id: string;
  versionNumber: number;
  status: RoundScheduleVersionStatus;
  scheduledCount: number;
  unscheduledCount: number;
  overallScore: number | null;
  createdAt: string;
}

/** spec §29/§69 — Publish. Field thật của BE (app/routes/target_room_publish.py::publish_readiness) */
export interface PublishReadinessBlocker {
  code: string;
  message: string;
}

export interface PublishReadiness {
  ready: boolean;
  versionId: number | null;
  blockers: PublishReadinessBlocker[];
}

/** spec §71 — Post-publish, đổi phòng cho một Session cụ thể (khác Room Assignment hàng loạt ở Phase 5) */
export interface ChangeRoomPayload {
  roomId: string;
  reason: string;
}

/** spec §72 — Council cũ giữ nguyên (immutable), tạo Council mới rồi gán lại session.councilId */
export interface ReplaceReviewerPayload {
  oldLecturerId: string;
  newLecturerId: string;
  reason: string;
}

/** spec §73 — Session gốc chỉ chuyển POSTPONED, không sửa giờ/phòng */
export interface PostponeRoundSessionPayload {
  reason: string;
}

/**
 * spec §73 — tạo Session bù, `makeupOfSessionId` trỏ về bản gốc. Spec không có JSON mẫu cho
 * payload này; field bên dưới là suy đoán hợp lý (cần lịch mới), đã ghi vào phases doc để hỏi BE.
 */
export interface CreateMakeupSessionPayload {
  date: string;
  timeslotId: string;
  roomId?: string;
}

export interface ScheduleRunPayload {
  randomSeed?: number;
  timeLimitSeconds?: number;
}

export type ScheduleObjectiveProfile = "LECTURER_COMPACT" | "LOAD_BALANCED" | "EARLY_FINISH";

export interface ScheduleVariantMetrics {
  reviewerBlockCount: number;
  reviewerIdleMinutes: number;
  reviewerLoadSpread: number;
  reviewerMinuteSpread: number;
  latestEndAt: string | null;
  scheduledGroups: number;
  roomAssignedCount?: number;
  roomUnassignedCount?: number;
}

/** Khớp dataclass `UnscheduledReason` (BE models.py) — KHÔNG có group_id/group_code/reason. */
export interface UnscheduledGroupReason {
  code: string;
  explanation: string;
  remediationHint: string;
}

export interface ScheduleRunResponse {
  versionId: number;
  status: string;
  scheduledCount: number;
  unscheduled: UnscheduledGroupReason[];
  softScores: Record<string, number>;
  objectiveProfile: ScheduleObjectiveProfile;
  objectiveLabel: string;
  metrics: ScheduleVariantMetrics;
  versions: ScheduleVariantSummary[];
}

export interface ScheduleVariantSummary {
  versionId: number;
  versionNo: number;
  status: ScheduleVersionStatus;
  objectiveProfile: ScheduleObjectiveProfile;
  objectiveLabel: string;
  scheduledCount: number;
  unscheduledCount: number;
  unscheduled: UnscheduledGroupReason[];
  objective: number;
  softScores: Record<string, number>;
  metrics: ScheduleVariantMetrics;
}

export interface ScheduleVersionSummary {
  id: number;
  roundId: number;
  versionNo: number;
  status: ScheduleVersionStatus;
  /** manager-api.md §10.9 — trạng thái hiển thị (khác `status` nghiệp vụ) */
  uiStatus: string;
  /** manager-api.md §10.9 */
  isActive: boolean;
  solverStatus: string;
  totalScore: number | null;
  softScores: Record<string, number>;
  randomSeed: number;
  createdAt: string;
  activatedAt: string | null;
  objectiveProfile?: ScheduleObjectiveProfile;
  objectiveLabel?: string;
  metrics?: ScheduleVariantMetrics;
  scheduledCount?: number;
  unscheduledCount?: number;
}

export interface ScheduleSession {
  id: number;
  groupId: number;
  groupCode: string;
  projectId: number;
  timeslotId: number;
  roomId: number | null;
  roomCode?: string | null;
  startAt: string;
  endAt: string;
  status: SessionStatus;
  reviewerIds: number[];
  resultOwnerIds: number[];
  reviewerNames: Record<string, string>;
}

/**
 * Solver assignment thô cho 1 version — tồn tại cho MỌI version (kể cả DRAFT chưa kích hoạt),
 * Có thể đã có phòng ngay từ lần chạy thuật toán; đây là field BE thực sự trả populated
 * trong `GET /schedule/versions/{id}` — không phải `sessions`.
 */
export interface ScheduleVersionAssignment {
  assignmentId: number;
  id: number;
  scheduleVersionId: number;
  groupId: number;
  groupCode: string;
  projectId: number;
  timeslotId: number;
  startAt: string;
  endAt: string;
  roomId: number | null;
  roomCode?: string | null;
  status: string;
  reviewerIds: number[];
  resultOwnerIds: number[];
  reviewerNames: Record<string, string>;
}

export interface ScheduleVersionDetail extends ScheduleVersionSummary {
  /** BE trả rỗng cho version chưa kích hoạt; xem trước dùng `assignments`. */
  sessions: ScheduleSession[];
  /** Nguồn dữ liệu thật để xem trước 1 version bất kỳ, kể cả DRAFT. */
  assignments: ScheduleVersionAssignment[];
}

export interface ActivateVersionResponse {
  versionId: number;
  status: ScheduleVersionStatus;
}

export interface PublishVersionResponse {
  roundId: number;
  versionId: number;
  status: "PUBLISHED";
  recipientCount: number;
}

export interface SessionEditPayload {
  timeslotId?: number;
  roomId?: number;
  reviewerIds?: number[];
  resultOwnerId?: number;
  reason: string;
}

export interface SessionEditResponse {
  sessionId: number;
  versionId: number;
  status: "UPDATED";
}

export interface ControlledChangeResponse {
  versionId: number;
  sourceVersionId: number;
  sessionId: number;
  status: "VALID";
}

export interface ReplacementSuggestion {
  timeslotId: number;
  roomId: number;
  reviewerIds: number[];
  replaces: number[];
}

export interface ResultOwnerPayload {
  lecturerId: number;
}

export interface ResultOwnerResponse {
  versionId: number;
  sessionId: number;
  resultOwnerId: number;
}

export interface H11WaiverPayload {
  reason: string;
}

export interface H11WaiverResponse {
  id: number;
  roundId: number;
  groupId: number;
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
  decisionNote: string;
}

export interface RoundOperationPayload {
  action: "POSTPONED" | "CANCELLED";
  reason: string;
}

export interface RoundOperationResponse {
  roundId: number;
  status: string;
}

export interface DeleteVersionResponse {
  id: number;
  deleted: true;
}

export const fetchScheduling = {
  /** POST /rounds/{round_id}/schedule/run?semester_id= — ADMIN, MANAGER. Có thể chạy nhiều lần (BR-SCH-01) */
  run: async (
    roundId: number,
    payload: ScheduleRunPayload = {},
    semesterId?: number | null
  ): Promise<ScheduleRunResponse> => {
    const response = await apiService.post<ScheduleRunResponse, ScheduleRunPayload, { semesterId?: number }>(
      `api/v1/rounds/${roundId}/schedule/run`,
      payload,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /rounds/{round_id}/schedule/versions?semester_id= — tất cả role, Manager thấy mọi version */
  versions: async (roundId: number, semesterId?: number | null): Promise<ScheduleVersionSummary[]> => {
    const response = await apiService.get<ScheduleVersionSummary[], { semesterId?: number }>(
      `api/v1/rounds/${roundId}/schedule/versions`,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /schedule/versions/{version_id}?semester_id= — nguồn dữ liệu chính cho Calendar */
  versionDetail: async (versionId: number, semesterId?: number | null): Promise<ScheduleVersionDetail> => {
    const response = await apiService.get<ScheduleVersionDetail, { semesterId?: number }>(
      `api/v1/schedule/versions/${versionId}`,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /schedule/versions/{version_id}/activate?semester_id= — ADMIN, MANAGER. Chỉ version VALID */
  activate: async (versionId: number, semesterId?: number | null): Promise<ActivateVersionResponse> => {
    const response = await apiService.post<ActivateVersionResponse, undefined, { semesterId?: number }>(
      `api/v1/schedule/versions/${versionId}/activate`,
      undefined,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/schedule/publish/{version_id}?semester_id= — ADMIN, MANAGER */
  publish: async (
    roundId: number,
    versionId: number,
    semesterId?: number | null
  ): Promise<PublishVersionResponse> => {
    const response = await apiService.post<PublishVersionResponse, undefined, { semesterId?: number }>(
      `api/v1/rounds/${roundId}/schedule/publish/${versionId}`,
      undefined,
      { semesterId: semesterId ?? undefined }
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
    const response = await apiService.post<SessionEditResponse, SessionEditPayload, { semesterId?: number }>(
      `api/v1/schedule/versions/${versionId}/sessions/${sessionId}/edit`,
      payload,
      { semesterId: semesterId ?? undefined }
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
    const response = await apiService.post<ControlledChangeResponse, SessionEditPayload, { semesterId?: number }>(
      `api/v1/schedule/versions/${versionId}/sessions/${sessionId}/controlled-change`,
      payload,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** DELETE /schedule/versions/{version_id}?semester_id= — ADMIN, MANAGER. 409 nếu version có dependency */
  deleteVersion: async (versionId: number, semesterId?: number | null): Promise<DeleteVersionResponse> => {
    const response = await apiService.delete<DeleteVersionResponse, { semesterId?: number }>(
      `api/v1/schedule/versions/${versionId}`,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /sessions/{session_id}/replacement-suggestions — ADMIN, MANAGER. Tối đa 50 item */
  replacementSuggestions: async (sessionId: number): Promise<ReplacementSuggestion[]> => {
    const response = await apiService.get<ReplacementSuggestion[]>(`api/v1/sessions/${sessionId}/replacement-suggestions`);
    return response.data;
  },

  /**
   * POST /schedule/versions/{version_id}/sessions/{session_id}/result-owner — MANAGER only.
   * Chỉ khi round bật result_owner_mode và type REVIEW_3/DEFENSE_2.
   */
  setResultOwner: async (
    versionId: number,
    sessionId: number,
    payload: ResultOwnerPayload
  ): Promise<ResultOwnerResponse> => {
    const response = await apiService.post<ResultOwnerResponse, ResultOwnerPayload>(
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
    const response = await apiService.post<H11WaiverResponse, H11WaiverPayload>(
      `api/v1/rounds/${roundId}/groups/${groupId}/h11-waiver`,
      payload
    );
    return response.data;
  },

  /** DELETE /rounds/{round_id}/groups/{group_id}/h11-waiver — MANAGER only */
  removeH11Waiver: async (roundId: number, groupId: number): Promise<H11WaiverResponse> => {
    const response = await apiService.delete<H11WaiverResponse>(`api/v1/rounds/${roundId}/groups/${groupId}/h11-waiver`);
    return response.data;
  },

  /** POST /sessions/{session_id}/postpone?semester_id= — ADMIN, MANAGER. Chỉ session SCHEDULED/ONGOING */
  postponeSession: async (
    sessionId: number,
    payload: PostponeSessionPayload,
    semesterId?: number | null
  ): Promise<PostponeSessionResponse> => {
    const response = await apiService.post<PostponeSessionResponse, PostponeSessionPayload, { semesterId?: number }>(
      `api/v1/sessions/${sessionId}/postpone`,
      payload,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /reschedule-requests/{request_id}/decision?semester_id= — ADMIN, MANAGER. Chỉ request đang REQUESTED */
  decideRescheduleRequest: async (
    requestId: number,
    payload: RescheduleDecisionPayload,
    semesterId?: number | null
  ): Promise<RescheduleDecisionResponse> => {
    const response = await apiService.post<RescheduleDecisionResponse, RescheduleDecisionPayload, { semesterId?: number }>(
      `api/v1/reschedule-requests/${requestId}/decision`,
      payload,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/operation — ADMIN, MANAGER. action: POSTPONED | CANCELLED */
  roundOperation: async (roundId: number, payload: RoundOperationPayload): Promise<RoundOperationResponse> => {
    const response = await apiService.post<RoundOperationResponse, RoundOperationPayload>(`api/v1/rounds/${roundId}/operation`, payload);
    return response.data;
  },

  /** GET /rounds/:roundId/scheduling-readiness — spec §25/§57 */
  readiness: async (roundId: string): Promise<SchedulingReadiness> => {
    const response = await apiService.get<{ data: SchedulingReadiness }>(
      `api/v1/rounds/${roundId}/scheduling-readiness`
    );
    return response.data.data;
  },

  /** POST /rounds/:roundId/schedules/generate — spec §58. Không fail toàn bộ khi partial (spec §62) */
  generate: async (roundId: string): Promise<GenerateScheduleResult> => {
    // The running BE exposes the durable scheduler at /schedule/run. Keep the
    // phase-4 method name so existing UI hooks remain stable, but adapt the
    // legacy response into the model used by this page.
    const response = await apiService.post<ScheduleRunResponse, ScheduleRunPayload>(`api/v1/rounds/${roundId}/schedule/run`, {});
    const result = response.data;
    return {
      versionId: String(result.versionId),
      versionNumber: result.versionId,
      status: "DRAFT",
      scheduledCount: result.scheduledCount,
      unscheduledCount: result.unscheduled.length,
      softScores: result.softScores,
    };
  },

  /** GET /rounds/:roundId/schedules — spec §26 */
  roundScheduleVersions: async (roundId: string): Promise<RoundScheduleVersionItem[]> => {
    const response = await apiService.get<ScheduleVersionSummary[]>(`api/v1/rounds/${roundId}/schedule/versions`);
    const versions = response.data;
    return Promise.all(versions.map(async (version) => {
      const detail = await apiService.get<ScheduleVersionDetail>(`api/v1/schedule/versions/${version.id}`);
      const assignments = detail.data.assignments ?? [];
      return {
        id: String(version.id),
        versionNumber: version.versionNo,
        status: version.status as RoundScheduleVersionStatus,
        scheduledCount: assignments.length,
        unscheduledCount: 0,
        overallScore: version.totalScore,
        createdAt: version.createdAt,
      };
    }));
  },

  /** POST /rounds/:roundId/schedules/:versionId/actions/set-active — spec §26/§64 */
  setActiveVersion: async (roundId: string, versionId: string): Promise<void> => {
    void roundId;
    await apiService.post(`api/v1/schedule/versions/${Number(versionId)}/activate`, {});
  },

  /** POST /rounds/:roundId/schedules/:versionId/actions/discard — spec §26 */
  discardVersion: async (roundId: string, versionId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/schedules/${versionId}/actions/discard`, {});
  },

  /** GET /rounds/:roundId/publish-readiness — spec §29/§69 */
  publishReadiness: async (roundId: string): Promise<PublishReadiness> => {
    const response = await apiService.get<{ data: PublishReadiness }>(`api/v1/rounds/${roundId}/publish-readiness`);
    return response.data.data;
  },

  /**
   * POST /rounds/:roundId/actions/publish — spec §29/§70.
   * Round SCHEDULED→PUBLISHED, Version ACTIVE→PUBLISHED, Session PLANNED→SCHEDULED.
   */
  publishRound: async (roundId: string, versionId: number): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/actions/publish`, { versionId });
  },

  /** POST /sessions/:sessionId/actions/change-room — spec §71 */
  changeSessionRoom: async (sessionId: string, payload: ChangeRoomPayload): Promise<void> => {
    await apiService.post(`api/v1/sessions/${sessionId}/actions/change-room`, payload);
  },

  /** POST /sessions/:sessionId/actions/replace-reviewer — spec §72 */
  replaceSessionReviewer: async (sessionId: string, payload: ReplaceReviewerPayload): Promise<void> => {
    await apiService.post(`api/v1/sessions/${sessionId}/actions/replace-reviewer`, payload);
  },

  /** POST /sessions/:sessionId/actions/postpone — spec §73 */
  postponeRoundSession: async (sessionId: string, payload: PostponeRoundSessionPayload): Promise<void> => {
    await apiService.post(`api/v1/sessions/${sessionId}/actions/postpone`, payload);
  },

  /** POST /sessions/:sessionId/makeup — spec §73 */
  createMakeupSession: async (sessionId: string, payload: CreateMakeupSessionPayload): Promise<void> => {
    await apiService.post(`api/v1/sessions/${sessionId}/makeup`, payload);
  },
};
