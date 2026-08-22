import apiService from "../core";
import { normalizeRoundTimeframeMetadata } from "./roundTimeframeContract";

export type RoundType =
  "REVIEW_1" | "REVIEW_2" | "DEFENSE_1_1" | "DEFENSE_1_2" | "DEFENSE_2";

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

export type RegistrationPhase = "INACTIVE" | "REGISTRATION" | "CLOSED";

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
  /** "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  groupSelectionMode: boolean;
  groupPreferenceDeadline: string | null;
  roomTypes: RoomType[];
  timeframeId?: string | null;
  timeframeVersionId?: string | null;
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
  /** "YYYY-MM-DD" — khoảng ngày hợp lệ cho round day/deadline (BE bắt buộc từ khi thêm start_date/end_date). */
  startDate: string;
  endDate: string;
  durationMinutes: number;
  reviewerCount: number;
  maxGroupsPerTimeslot: number;
  registrationDeadline: string | null;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string | null;
  /** Lecturer và Leader đăng ký song song trong cùng phase REGISTRATION, dùng chung một deadline hiệu lực. */
  registrationPhase?: RegistrationPhase;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
  timeframeId: string | null;
  timeframeVersionId: string | null;
  days: RoundDay[];
}

export interface RoundCreatePayload {
  name: string;
  type: RoundType;
  description?: string;
  /** "YYYY-MM-DD" — bắt buộc: bao khoảng ngày cho toàn bộ round day/deadline. */
  startDate: string;
  endDate: string;
  durationMinutes: number;
  reviewerCount: number;
  maxGroupsPerTimeslot: number;
  registrationDeadline: string;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
  /** Mutually exclusive with timeframeId. */
  days?: RoundDayInput[];
  /** Backend materializes days/timeslots from the active Timeframe revision. */
  timeframeId?: number;
}

export interface RoundCreateResponse {
  id: string;
  name: string;
  status: RoundStatus;
}

/**
 * PATCH /rounds/:roundId — BE checklist A2, endpoint đã build (`manager_extensions.py`
 * `update_round`). BE chỉ nhận đúng các field dưới đây (Pydantic `RoundUpdate`) — không có
 * `name`/`description`. Round phải ở DRAFT/OPEN_REGISTRATION
 * (409 `ROUND_CONFIG_LOCKED` nếu không) và `reviewerCount` bị BE khoá cứng theo `type`
 * (luôn 422 `REVIEWER_COUNT_INVALID` nếu khác giá trị mặc định của loại đợt) nên FE không cho sửa.
 */
export interface RoundUpdatePayload {
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  maxGroupsPerTimeslot?: number;
  registrationDeadline?: string;
  groupSelectionMode?: boolean;
  groupPreferenceDeadline?: string | null;
  resultOwnerMode?: boolean;
  roomTypes?: RoomType[];
  /** Change the pinned Timeframe while the Round is still DRAFT. */
  timeframeId?: number;
}

/** capstone-fe-be-implementation-spec.md §5 — thêm EXPIRED/WITHDRAWN so với PENDING/ACCEPTED/REJECTED cũ */
export type RoundInvitationStatus =
  "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";

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
  lecturers: {
    invited: number;
    accepted: number;
    availabilitySubmitted: number;
    missing: number;
  };
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

export interface AttachRoundResourcesPayload {
  groupIds: string[];
  timeslotIds: string[];
  roomTypes: RoomType[];
}

export interface RoundTimeslot {
  id: number;
  start_at: string;
  end_at: string;
  day_date: string;
}

export interface RoundLecturerAvailabilityEntry {
  lecturer_id: number;
  timeslot_id: number;
  state: "AVAILABLE" | "UNAVAILABLE" | string;
  load_preference: string | null;
  source: string;
}

export interface RoundGroupAvailabilityEntry {
  group_id: number;
  timeslot_id: number;
  selected: boolean;
  source: string;
}

export interface RoundMyAvailabilityResponse {
  round: {
    id: number;
    type: RoundType;
    group_selection_mode: boolean;
    registration_deadline: string | null;
  };
  timeslots: RoundTimeslot[];
  /**
   * Chỉ có khi caller là ADMIN/MANAGER — audit view. BE xác nhận đây là mảng object
   * (không phải map theo id), lọc `state === "AVAILABLE"` để biết giảng viên rảnh slot đó.
   */
  selected_by_lecturer?: RoundLecturerAvailabilityEntry[];
  selected_by_group?: RoundGroupAvailabilityEntry[];
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function unwrapData(value: unknown): unknown {
  return isRecord(value) && "data" in value ? value.data : value;
}

function asArray(value: unknown): unknown[] {
  const data = unwrapData(value);
  return Array.isArray(data) ? data : [];
}

function asString(value: unknown, fallback = ""): string {
  return value === undefined || value === null ? fallback : String(value);
}

function asNullableString(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(number) ? number : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function durationMinutes(record: ApiRecord): number {
  const keys = [
    "durationMinutes",
    "duration_minutes",
    "session_duration_minutes",
    "sessionDurationMinutes",
    "duration",
  ];

  for (const key of keys) {
    const number = asNumber(record[key]);
    if (number > 0) return number;
  }

  return 0;
}

function normalizeRoundListItem(value: unknown): RoundListItem {
  const record = isRecord(value) ? value : {};
  const roomTypes = pick(record, "roomTypes", "room_types");
  return {
    id: asString(pick(record, "id", "round_id")),
    name: asString(pick(record, "name")),
    type: pick(record, "type") as RoundType,
    status: pick(record, "status") as RoundStatus,
    durationMinutes: durationMinutes(record),
    reviewerCount: asNumber(pick(record, "reviewerCount", "reviewer_count")),
    startDate: asString(pick(record, "startDate", "start_date")),
    endDate: asString(pick(record, "endDate", "end_date")),
    registrationDeadline: asNullableString(
      pick(record, "registrationDeadline", "registration_deadline"),
    ),
    groupSelectionMode: asBoolean(
      pick(record, "groupSelectionMode", "group_selection_mode"),
    ),
    groupPreferenceDeadline: asNullableString(
      pick(record, "groupPreferenceDeadline", "group_preference_deadline"),
    ),
    roomTypes: Array.isArray(roomTypes) ? roomTypes.filter(isRoomType) : [],
    ...normalizeRoundTimeframeMetadata(record),
  };
}

function normalizeRoundDays(value: unknown): RoundDay[] {
  if (!Array.isArray(value)) return [];

  return value.map((day) => {
    const dayRecord = isRecord(day) ? day : {};
    const slots = pick(dayRecord, "slots");
    return {
      date: asString(pick(dayRecord, "date", "day_date")),
      slots: Array.isArray(slots)
        ? slots.map((slot) => {
            const slotRecord = isRecord(slot) ? slot : {};
            return {
              id: asString(pick(slotRecord, "id", "timeslot_id")),
              startTime: asString(pick(slotRecord, "startTime", "start_at")),
              endTime: asString(pick(slotRecord, "endTime", "end_at")),
            };
          })
        : [],
    };
  });
}

function isRoomType(value: unknown): value is RoomType {
  return value === "NORMAL" || value === "SEMINAR" || value === "LAB";
}

function normalizeRoundDetail(value: unknown): RoundDetail {
  const record = isRecord(value) ? value : {};
  const roomTypes = pick(record, "roomTypes", "room_types");

  return {
    id: asString(pick(record, "id", "round_id")),
    semesterId: asString(pick(record, "semesterId", "semester_id")),
    name: asString(pick(record, "name")),
    type: pick(record, "type") as RoundType,
    status: pick(record, "status") as RoundStatus,
    description: asString(pick(record, "description")),
    startDate: asString(pick(record, "startDate", "start_date")),
    endDate: asString(pick(record, "endDate", "end_date")),
    durationMinutes: durationMinutes(record),
    reviewerCount: asNumber(pick(record, "reviewerCount", "reviewer_count")),
    maxGroupsPerTimeslot: asNumber(
      pick(record, "maxGroupsPerTimeslot", "max_groups_per_timeslot"),
    ),
    registrationDeadline: asNullableString(
      pick(record, "registrationDeadline", "registration_deadline"),
    ),
    groupSelectionMode: asBoolean(
      pick(record, "groupSelectionMode", "group_selection_mode"),
    ),
    groupPreferenceDeadline: asNullableString(
      pick(record, "groupPreferenceDeadline", "group_preference_deadline"),
    ),
    registrationPhase: pick(
      record,
      "registrationPhase",
      "registration_phase",
    ) as RegistrationPhase | undefined,
    resultOwnerMode: asBoolean(
      pick(record, "resultOwnerMode", "result_owner_mode"),
    ),
    roomTypes: Array.isArray(roomTypes) ? roomTypes.filter(isRoomType) : [],
    ...normalizeRoundTimeframeMetadata(record),
    days: normalizeRoundDays(pick(record, "days", "round_days")),
  };
}

function normalizeInvitationStatus(value: unknown): RoundInvitationStatus {
  if (value === "REJECTED") return "DECLINED";
  if (
    value === "ACCEPTED" ||
    value === "DECLINED" ||
    value === "EXPIRED" ||
    value === "WITHDRAWN"
  )
    return value;
  return "PENDING";
}

function normalizeInvitation(value: unknown): RoundInvitation {
  const record = isRecord(value) ? value : {};
  const lecturerRecord = isRecord(pick(record, "lecturer"))
    ? (pick(record, "lecturer") as ApiRecord)
    : {};
  const lecturerId = asString(
    pick(lecturerRecord, "id", "lecturer_id") ?? pick(record, "lecturer_id"),
  );

  return {
    id: asString(pick(record, "id", "invitation_id"), lecturerId),
    lecturer: {
      id: lecturerId,
      code: asString(
        pick(lecturerRecord, "code", "lecturer_code") ??
          pick(record, "lecturer_code"),
      ),
      fullName: asString(
        pick(lecturerRecord, "fullName", "full_name", "display_name") ??
          pick(record, "display_name"),
      ),
    },
    status: normalizeInvitationStatus(
      pick(record, "status", "invitation_status"),
    ),
    availabilitySlotCount: asNumber(
      pick(record, "availabilitySlotCount", "available_slot_count"),
    ),
    usedQuota: asNumber(pick(record, "usedQuota", "used_quota")),
    semesterQuota: asNumber(pick(record, "semesterQuota", "semester_quota")),
  };
}

function normalizeEligibleProject(value: unknown): EligibleProjectRow {
  const record = isRecord(value) ? value : {};
  const checks = isRecord(pick(record, "checks"))
    ? (pick(record, "checks") as ApiRecord)
    : {};
  const blockingReasons = pick(record, "blockingReasons", "blocking_reasons");
  const warnings = pick(record, "warnings");
  const groupId = asString(pick(record, "groupId", "group_id"));

  return {
    projectId: asString(pick(record, "projectId", "project_id"), groupId),
    groupId,
    eligible: asBoolean(pick(record, "eligible")),
    checks: {
      hasGroup: asBoolean(pick(checks, "hasGroup", "has_group")),
      hasActiveLeader: asBoolean(
        pick(checks, "hasActiveLeader", "has_active_leader"),
      ),
      hasMainSupervisor: asBoolean(
        pick(checks, "hasMainSupervisor", "has_main_supervisor"),
      ),
      progressionAllowed: asBoolean(
        pick(checks, "progressionAllowed", "progression_allowed"),
      ),
    },
    blockingReasons: Array.isArray(blockingReasons)
      ? blockingReasons.map((reason) => asString(reason))
      : [],
    warnings: Array.isArray(warnings)
      ? warnings.map((warning) => {
          const warningRecord = isRecord(warning) ? warning : {};
          return {
            code: asString(pick(warningRecord, "code")),
            message: asString(
              pick(warningRecord, "message"),
              asString(warning),
            ),
          };
        })
      : [],
  };
}

function normalizeRegistrationSummary(value: unknown): RegistrationSummary {
  const record = isRecord(value) ? value : {};
  const lecturers = isRecord(pick(record, "lecturers"))
    ? (pick(record, "lecturers") as ApiRecord)
    : {};
  const groups = isRecord(pick(record, "groups"))
    ? (pick(record, "groups") as ApiRecord)
    : {};

  return {
    lecturers: {
      invited: asNumber(pick(lecturers, "invited") ?? pick(record, "invited")),
      accepted: asNumber(
        pick(lecturers, "accepted") ?? pick(record, "responded"),
      ),
      availabilitySubmitted: asNumber(
        pick(lecturers, "availabilitySubmitted", "availability_submitted") ??
          pick(record, "lecturer_availability"),
      ),
      missing: asNumber(pick(lecturers, "missing")),
    },
    groups: {
      eligible: asNumber(pick(groups, "eligible")),
      preferenceSubmitted: asNumber(
        pick(groups, "preferenceSubmitted", "preference_submitted"),
      ),
      missing: asNumber(pick(groups, "missing")),
    },
  };
}

export const fetchRounds = {
  /** GET /semesters/:semesterId/rounds — spec §19 */
  list: async (
    semesterId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<{ data: RoundListItem[]; meta?: RoundListMeta }> => {
    const response = await apiService.get<unknown>(
      `api/v1/semesters/${semesterId}/rounds`,
      params,
    );
    const payload = response.data;
    const metaRecord =
      isRecord(payload) && isRecord(payload.meta) ? payload.meta : undefined;
    const meta = metaRecord
      ? {
          page: asNumber(pick(metaRecord, "page")),
          pageSize: asNumber(pick(metaRecord, "pageSize", "page_size")),
          total: asNumber(pick(metaRecord, "total")),
        }
      : undefined;
    return { data: asArray(payload).map(normalizeRoundListItem), meta };
  },

  /** GET /rounds/:roundId — spec §21/§50 */
  getById: async (roundId: string): Promise<RoundDetail> => {
    const response = await apiService.get<unknown>(`api/v1/rounds/${roundId}`);
    return normalizeRoundDetail(unwrapData(response.data));
  },

  /** POST /semesters/:semesterId/rounds — spec §20/§49. days[].slots[] gửi ngay trong request tạo */
  create: async (
    semesterId: string,
    payload: RoundCreatePayload,
  ): Promise<RoundCreateResponse> => {
    const response = await apiService.post<{ data: RoundCreateResponse }>(
      `api/v1/semesters/${semesterId}/rounds`,
      payload,
    );
    return response.data.data;
  },

  /**
   * PATCH /rounds/:roundId — sửa cấu hình khi Round còn DRAFT/OPEN_REGISTRATION.
   * Response BE trả nguyên cột snake_case của bảng `rounds` (không bọc `{data}`, không cùng
   * shape contract camelCase như `GET /rounds/:roundId`) nên bỏ qua body, để caller invalidate
   * và refetch qua `getById` lấy dữ liệu đã chuẩn hoá.
   */
  update: async (roundId: string, payload: RoundUpdatePayload): Promise<void> => {
    const body: Record<string, unknown> = {};
    if (payload.startDate !== undefined) body.start_date = payload.startDate;
    if (payload.endDate !== undefined) body.end_date = payload.endDate;
    if (payload.durationMinutes !== undefined) body.session_duration_minutes = payload.durationMinutes;
    if (payload.maxGroupsPerTimeslot !== undefined) body.max_groups_per_timeslot = payload.maxGroupsPerTimeslot;
    if (payload.registrationDeadline !== undefined) body.registration_deadline = payload.registrationDeadline;
    if (payload.groupSelectionMode !== undefined) body.group_selection_mode = payload.groupSelectionMode;
    if (payload.groupPreferenceDeadline !== undefined) body.group_preference_deadline = payload.groupPreferenceDeadline;
    if (payload.resultOwnerMode !== undefined) body.result_owner_mode = payload.resultOwnerMode;
    if (payload.roomTypes !== undefined) body.room_types = payload.roomTypes;
    if (payload.timeframeId !== undefined) body.timeframe_id = payload.timeframeId;
    await apiService.patch(`api/v1/rounds/${roundId}`, body);
  },

  /** POST /rounds/:roundId/actions/open-registration — spec §21/§51. DRAFT → OPEN_REGISTRATION */
  openRegistration: async (roundId: string): Promise<void> => {
    await apiService.post(
      `api/v1/rounds/${roundId}/actions/open-registration`,
      {},
    );
  },

  /** POST /rounds/:roundId/actions/close-registration — spec §21/§52. OPEN_REGISTRATION → REGISTRATION_CLOSED */
  closeRegistration: async (roundId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/actions/close-registration`, {});
  },

  /** GET /rounds/:roundId/invitations — spec §22 */
  invitations: async (roundId: string): Promise<RoundInvitation[]> => {
    const response = await apiService.get<unknown>(
      `api/v1/rounds/${roundId}/invitations`,
    );
    return asArray(response.data).map(normalizeInvitation);
  },

  /** POST /rounds/:roundId/invitations — spec §22/§53. Trạng thái khởi tạo: PENDING */
  invite: async (
    roundId: string,
    payload: InviteLecturersPayload,
  ): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/invitations`, payload);
  },

  /** POST /rounds/:roundId/invitations/:invitationId/remind — spec §22 */
  remindInvitation: async (roundId: string, invitationId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/invitations/${invitationId}/remind`, {});
  },

  /** GET /rounds/:roundId/eligible-projects — spec §23/§48 */
  eligibleProjects: async (roundId: string): Promise<EligibleProjectRow[]> => {
    const response = await apiService.get<unknown>(
      `api/v1/rounds/${roundId}/eligible-projects`,
    );
    return asArray(response.data).map(normalizeEligibleProject);
  },

  /** POST /rounds/:roundId/resources — gắn nhóm, timeslot và loại phòng cho Round. */
  attachResources: async (
    roundId: string,
    payload: AttachRoundResourcesPayload,
  ): Promise<void> => {
    const toLegacyId = (value: string) => {
      const raw = value.includes("_")
        ? value.slice(value.indexOf("_") + 1)
        : value;
      const id = Number(raw);
      if (!Number.isInteger(id) || id <= 0)
        throw new Error("Identifier must be numeric");
      return id;
    };
    await apiService.post(`api/v1/rounds/${roundId}/resources`, {
      group_ids: payload.groupIds.map(toLegacyId),
      timeslot_ids: payload.timeslotIds.map(toLegacyId),
      room_types: payload.roomTypes,
    });
  },

  /** GET /rounds/:roundId/registration-summary — spec §24 */
  registrationSummary: async (
    roundId: string,
  ): Promise<RegistrationSummary> => {
    const response = await apiService.get<unknown>(
      `api/v1/rounds/${roundId}/registration-summary`,
    );
    return normalizeRegistrationSummary(unwrapData(response.data));
  },

  // Chưa migrate (Phase 4 — Scheduling/CP-SAT), vẫn dùng route/shape cũ, chỉ phục vụ Calendar:

  /** GET /rounds/{round_id}/my-availability — nguồn timeslot cho Calendar */
  myAvailability: async (
    roundId: number,
  ): Promise<RoundMyAvailabilityResponse> => {
    const response = await apiService.get<RoundMyAvailabilityResponse>(
      `api/v1/rounds/${roundId}/my-availability`,
    );
    return response.data;
  },
};
