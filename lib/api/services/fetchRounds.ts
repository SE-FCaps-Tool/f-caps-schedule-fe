import apiService from "../core";

export type RoundType = "REVIEW_1" | "REVIEW_2" | "DEFENSE_1_1" | "DEFENSE_1_2" | "DEFENSE_2";

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
  | "POSTPONED"
  | "CANCELLED";

export interface RoundApiItem {
  id: number;
  semester_id: number;
  type: RoundType;
  status: RoundStatus;
  reviewer_count: number;
  result_owner_mode: boolean;
  group_selection_mode: boolean;
  session_duration_minutes: number;
  /** manager-api.md §10.4 */
  start_date: string;
  /** manager-api.md §10.4 */
  end_date: string;
  registration_deadline: string | null;
  h12_sessions_per_part: number;
  h12_sessions_per_day: number;
  h12_semester_quota: number | null;
  /** manager-api.md §10.4 */
  max_groups_per_timeslot: number;
  /** manager-api.md §10.4 */
  max_minutes_per_part: number;
  /** manager-api.md §10.4 */
  max_minutes_per_day: number;
  soft_weights: Record<string, number>;
}

export interface RoundCreatePayload {
  semester_id: number;
  type: RoundType;
  reviewer_count: number;
  result_owner_mode?: boolean;
  group_selection_mode?: boolean;
  session_duration_minutes: number;
  start_date: string;
  end_date: string;
  registration_deadline?: string | null;
  h12_sessions_per_part?: number;
  h12_sessions_per_day?: number;
  h12_semester_quota?: number | null;
  max_groups_per_timeslot?: number;
  max_minutes_per_part?: number;
  max_minutes_per_day?: number;
  soft_weights?: Record<string, number>;
}

export interface RoundTransitionPayload {
  target_status: string;
  reason?: string;
}

export interface RoundTransitionResponse {
  round_id: number;
  status: RoundStatus;
}

export interface RoundDaySlotPayload {
  start_at: string;
  end_at: string;
}

export interface RoundDayCreatePayload {
  day_date: string;
  slots: RoundDaySlotPayload[];
}

export interface RoundDayCreateResponse {
  round_id: number;
  day_id: number;
  timeslot_ids: number[];
}

export interface RoundResourcesPayload {
  group_ids: number[];
  room_ids: number[];
  timeslot_ids: number[];
}

export interface RoundResourcesResponse {
  round_id: number;
  groups: number[];
  timeslots: number[];
  rooms: number[];
}

export interface InvitationCreatePayload {
  lecturer_ids: number[];
}

export interface InvitationCreateResponse {
  round_id: number;
  invited_count: number;
}

export interface AvailabilitySubmitPayload {
  selected_timeslot_ids: number[];
  load_preference?: "LOW" | "MEDIUM" | "HIGH";
}

export interface AvailabilitySubmitResponse {
  round_id: number;
  lecturer_id?: number;
  group_id?: number;
  selected_count: number;
  total_slots: number;
  source: "FORM" | "MANAGER";
}

export interface RoundRegistrationResponse {
  invited: number;
  responded: number;
  lecturer_availability: number;
  group_availability: number;
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

export interface RoundInvitationRow {
  lecturer_id: number;
  lecturer_code: string;
  display_name: string;
  invitation_status: "PENDING" | "ACCEPTED" | "REJECTED";
  available_slot_count: number;
  load_preference: "LOW" | "MEDIUM" | "HIGH" | null;
  semester_quota: number;
  used_quota: number;
}

export interface ResendInvitationResponse {
  round_id: number;
  lecturer_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  resent: boolean;
}

/** manager-api.md §10.4 PATCH — mọi field optional; chỉ sửa khi round DRAFT/OPEN_REGISTRATION */
export interface RoundConfigUpdatePayload {
  end_date?: string;
  reviewer_count?: number;
  result_owner_mode?: boolean;
  group_selection_mode?: boolean;
  session_duration_minutes?: number;
  registration_deadline?: string | null;
  h12_sessions_per_part?: number;
  h12_sessions_per_day?: number;
  h12_semester_quota?: number | null;
  max_groups_per_timeslot?: number;
  max_minutes_per_part?: number;
  max_minutes_per_day?: number;
  soft_weights?: Record<string, number>;
}

export interface RoundGroupRosterRow {
  group_id: number;
  group_code: string;
  eligible: boolean;
  leader_name: string | null;
  selected_slot_count: number;
  status: string;
}

export const fetchRounds = {
  /** GET /rounds?semester_id= — ADMIN, MANAGER. Đã hỗ trợ ở backend (manager-api.md §8) */
  list: async (semesterId?: number | null): Promise<RoundApiItem[]> => {
    const response = await apiService.get<RoundApiItem[]>("api/v1/rounds", {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /rounds/{round_id}?semester_id= — resource-scope check theo manager-api.md §5 */
  getById: async (roundId: number, semesterId?: number | null): Promise<RoundApiItem> => {
    const response = await apiService.get<RoundApiItem>(`api/v1/rounds/${roundId}`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /rounds/{round_id}/invitations?semester_id= — resource-scope check theo manager-api.md §5 */
  invitations: async (roundId: number, semesterId?: number | null): Promise<RoundInvitationRow[]> => {
    const response = await apiService.get<RoundInvitationRow[]>(`api/v1/rounds/${roundId}/invitations`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /rounds/{round_id}/groups?semester_id= — resource-scope check theo manager-api.md §5 */
  groupRoster: async (roundId: number, semesterId?: number | null): Promise<RoundGroupRosterRow[]> => {
    const response = await apiService.get<RoundGroupRosterRow[]>(`api/v1/rounds/${roundId}/groups`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** POST /rounds — ADMIN, MANAGER */
  create: async (payload: RoundCreatePayload): Promise<RoundApiItem> => {
    const response = await apiService.post<RoundApiItem>("api/v1/rounds", payload);
    return response.data;
  },

  /** POST /rounds/{round_id}/transition — ADMIN, MANAGER */
  transition: async (roundId: number, payload: RoundTransitionPayload): Promise<RoundTransitionResponse> => {
    const response = await apiService.post<RoundTransitionResponse>(
      `api/v1/rounds/${roundId}/transition`,
      payload
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/days — ADMIN, MANAGER. Phòng không gắn ở bước này (BR-RND-02) */
  addDay: async (roundId: number, payload: RoundDayCreatePayload): Promise<RoundDayCreateResponse> => {
    const response = await apiService.post<RoundDayCreateResponse>(`api/v1/rounds/${roundId}/days`, payload);
    return response.data;
  },

  /** POST /rounds/{round_id}/resources — ADMIN, MANAGER */
  setResources: async (roundId: number, payload: RoundResourcesPayload): Promise<RoundResourcesResponse> => {
    const response = await apiService.post<RoundResourcesResponse>(
      `api/v1/rounds/${roundId}/resources`,
      payload
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/invitations — ADMIN, MANAGER */
  invite: async (roundId: number, payload: InvitationCreatePayload): Promise<InvitationCreateResponse> => {
    const response = await apiService.post<InvitationCreateResponse>(
      `api/v1/rounds/${roundId}/invitations`,
      payload
    );
    return response.data;
  },

  /**
   * POST /rounds/{round_id}/lecturers/{lecturer_id}/availability — ADMIN, MANAGER, LECTURER.
   * Manager/Admin dùng để nhập hộ khi GV quên đăng ký (BR-AVL-04).
   */
  submitLecturerAvailability: async (
    roundId: number,
    lecturerId: number,
    payload: AvailabilitySubmitPayload
  ): Promise<AvailabilitySubmitResponse> => {
    const response = await apiService.post<AvailabilitySubmitResponse>(
      `api/v1/rounds/${roundId}/lecturers/${lecturerId}/availability`,
      payload
    );
    return response.data;
  },

  /**
   * POST /rounds/{round_id}/groups/{group_id}/availability — ADMIN, MANAGER, STUDENT.
   * Chỉ dùng khi round bật `group_selection_mode` (409 GROUP_SELECTION_DISABLED nếu không).
   */
  submitGroupAvailability: async (
    roundId: number,
    groupId: number,
    payload: AvailabilitySubmitPayload
  ): Promise<AvailabilitySubmitResponse> => {
    const response = await apiService.post<AvailabilitySubmitResponse>(
      `api/v1/rounds/${roundId}/groups/${groupId}/availability`,
      payload
    );
    return response.data;
  },

  /** GET /rounds/{round_id}/registration — ADMIN, MANAGER. Chỉ số đếm tổng, xem manager-api.md §8.3/§8.4 */
  registration: async (roundId: number): Promise<RoundRegistrationResponse> => {
    const response = await apiService.get<RoundRegistrationResponse>(`api/v1/rounds/${roundId}/registration`);
    return response.data;
  },

  /** GET /rounds/{round_id}/my-availability — nguồn timeslot cho Calendar */
  myAvailability: async (roundId: number): Promise<RoundMyAvailabilityResponse> => {
    const response = await apiService.get<RoundMyAvailabilityResponse>(
      `api/v1/rounds/${roundId}/my-availability`
    );
    return response.data;
  },

  /** POST /rounds/{round_id}/invitations/{lecturer_id}/resend?semester_id= — ADMIN, MANAGER. manager-api.md §10.5 */
  resendInvitation: async (
    roundId: number,
    lecturerId: number,
    semesterId?: number | null
  ): Promise<ResendInvitationResponse> => {
    const response = await apiService.post<ResendInvitationResponse>(
      `api/v1/rounds/${roundId}/invitations/${lecturerId}/resend`,
      undefined,
      { semester_id: semesterId ?? undefined }
    );
    return response.data;
  },

  /**
   * PATCH /rounds/{round_id}?semester_id= — ADMIN, MANAGER.
   * Chỉ cho sửa khi round là DRAFT hoặc OPEN_REGISTRATION (manager-api.md §10.4).
   */
  updateConfig: async (
    roundId: number,
    payload: RoundConfigUpdatePayload,
    semesterId?: number | null
  ): Promise<RoundApiItem> => {
    const response = await apiService.patch<RoundApiItem>(`api/v1/rounds/${roundId}`, payload, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },
};
