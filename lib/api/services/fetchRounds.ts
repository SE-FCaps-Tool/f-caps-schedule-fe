import apiService from "../core";

export type RoundType = "REVIEW_1" | "REVIEW_2" | "DEFENSE_1_1" | "DEFENSE_1_2" | "DEFENSE_2";

/** capstone-fe-be-implementation-spec.md §4 — CANCELLED thay cho POSTPONED cũ */
export type RoundStatus =
  | "DRAFT"
  | "OPEN_REGISTRATION"
  | "REGISTRATION_CLOSED"
  | "SCHEDULING"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "LOCKED"
  | "CANCELLED";

export type RoomType = "NORMAL" | "SEMINAR" | "LAB";

export interface RoundTimeslotInput {
  startTime: string;
  endTime: string;
}

export interface RoundDayInput {
  /** "YYYY-MM-DD" */
  date: string;
  slots: RoundTimeslotInput[];
}

/** Timeslot của config Round mới (spec §4) — khác `RoundTimeslot` cũ (start_at/end_at) dùng ở Phase 3/4 chưa migrate */
export interface RoundConfigTimeslot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface RoundDay {
  date: string;
  slots: RoundConfigTimeslot[];
}

export interface RoundListItem {
  id: string;
  name: string;
  type: RoundType;
  status: RoundStatus;
  durationMinutes: number;
  reviewerCount: number;
  registrationDeadline: string | null;
}

export interface RoundListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface RoundDetail {
  id: string;
  semesterId: string;
  name: string;
  type: RoundType;
  status: RoundStatus;
  description?: string;
  durationMinutes: number;
  reviewerCount: number;
  maxGroupsPerTimeslot: number;
  registrationDeadline: string;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string | null;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
  days: RoundDay[];
}

export interface RoundCreatePayload {
  name: string;
  type: RoundType;
  description?: string;
  durationMinutes: number;
  reviewerCount: number;
  maxGroupsPerTimeslot: number;
  registrationDeadline: string;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
  days: RoundDayInput[];
}

export interface RoundCreateResponse {
  id: string;
  name: string;
  status: RoundStatus;
}

/** capstone-fe-be-implementation-spec.md §5 — thêm EXPIRED/WITHDRAWN so với PENDING/ACCEPTED/REJECTED cũ */
export type RoundInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";

export interface RoundInvitation {
  id: string;
  lecturer: { id: string; code: string; fullName: string };
  status: RoundInvitationStatus;
  availabilitySlotCount: number;
  usedQuota: number;
  semesterQuota: number;
}

export interface InviteLecturersPayload {
  lecturerIds: string[];
}

export interface RegistrationSummary {
  lecturers: { invited: number; accepted: number; availabilitySubmitted: number; missing: number };
  groups: { eligible: number; preferenceSubmitted: number; missing: number };
}

export interface EligibleProjectRow {
  projectId: string;
  groupId: string;
  eligible: boolean;
  checks: {
    hasGroup: boolean;
    hasActiveLeader: boolean;
    hasMainSupervisor: boolean;
    progressionAllowed: boolean;
  };
  blockingReasons: string[];
  warnings: { code: string; message: string }[];
}

export interface RoundTimeslot {
  id: number;
  start_at: string;
  end_at: string;
  day_date: string;
}

export interface RoundMyAvailabilityResponse {
  round: { id: number; type: RoundType; group_selection_mode: boolean; registration_deadline: string | null };
  timeslots: RoundTimeslot[];
  /** Chỉ có khi caller là ADMIN/MANAGER — audit view */
  selected_by_lecturer?: Record<string, number[]>;
  selected_by_group?: Record<string, number[]>;
}

export const fetchRounds = {
  /** GET /semesters/:semesterId/rounds — spec §19 */
  list: async (
    semesterId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<{ data: RoundListItem[]; meta?: RoundListMeta }> => {
    const response = await apiService.get<{ data: RoundListItem[]; meta?: RoundListMeta }>(
      `api/v1/semesters/${semesterId}/rounds`,
      params
    );
    return response.data;
  },

  /** GET /rounds/:roundId — spec §21/§50 */
  getById: async (roundId: string): Promise<RoundDetail> => {
    const response = await apiService.get<{ data: RoundDetail }>(`api/v1/rounds/${roundId}`);
    return response.data.data;
  },

  /** POST /semesters/:semesterId/rounds — spec §20/§49. days[].slots[] gửi ngay trong request tạo */
  create: async (semesterId: string, payload: RoundCreatePayload): Promise<RoundCreateResponse> => {
    const response = await apiService.post<{ data: RoundCreateResponse }>(
      `api/v1/semesters/${semesterId}/rounds`,
      payload
    );
    return response.data.data;
  },

  /** POST /rounds/:roundId/actions/open-registration — spec §21/§51. DRAFT → OPEN_REGISTRATION */
  openRegistration: async (roundId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/actions/open-registration`);
  },

  /** POST /rounds/:roundId/actions/close-registration — spec §21/§52. OPEN_REGISTRATION → REGISTRATION_CLOSED */
  closeRegistration: async (roundId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/actions/close-registration`);
  },

  /** GET /rounds/:roundId/invitations — spec §22 */
  invitations: async (roundId: string): Promise<RoundInvitation[]> => {
    const response = await apiService.get<{ data: RoundInvitation[] }>(`api/v1/rounds/${roundId}/invitations`);
    return response.data.data;
  },

  /** POST /rounds/:roundId/invitations — spec §22/§53. Trạng thái khởi tạo: PENDING */
  invite: async (roundId: string, payload: InviteLecturersPayload): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/invitations`, payload);
  },

  /** POST /rounds/:roundId/invitations/:invitationId/remind — spec §22 */
  remindInvitation: async (roundId: string, invitationId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/invitations/${invitationId}/remind`);
  },

  /** GET /rounds/:roundId/eligible-projects — spec §23/§48 */
  eligibleProjects: async (roundId: string): Promise<EligibleProjectRow[]> => {
    const response = await apiService.get<{ data: EligibleProjectRow[] }>(`api/v1/rounds/${roundId}/eligible-projects`);
    return response.data.data;
  },

  /** GET /rounds/:roundId/registration-summary — spec §24 */
  registrationSummary: async (roundId: string): Promise<RegistrationSummary> => {
    const response = await apiService.get<{ data: RegistrationSummary }>(`api/v1/rounds/${roundId}/registration-summary`);
    return response.data.data;
  },

  // Chưa migrate (Phase 4 — Scheduling/CP-SAT), vẫn dùng route/shape cũ, chỉ phục vụ Calendar:

  /** GET /rounds/{round_id}/my-availability — nguồn timeslot cho Calendar */
  myAvailability: async (roundId: number): Promise<RoundMyAvailabilityResponse> => {
    const response = await apiService.get<RoundMyAvailabilityResponse>(
      `api/v1/rounds/${roundId}/my-availability`
    );
    return response.data;
  },
};
