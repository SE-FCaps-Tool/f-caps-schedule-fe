import apiService from "../core";

export type RoundType =
  | "REVIEW_1"
  | "REVIEW_2"
  | "REVIEW_1_1"
  | "REVIEW_2_1"
  | "DEFENSE_1_1"
  | "DEFENSE_1_2"
  | "DEFENSE_2"
  // Legacy values returned by older BE rows.
  | "REVIEW_3"
  | "DEFENSE_1";

/** Round lifecycle values mirror the BE round_status enum. */
export type RoundStatus =
  | "DRAFT"
  | "OPEN_REGISTRATION"
  | "REGISTRATION_CLOSED"
  | "SCHEDULING"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ONGOING"
  | "POSTPONED"
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

/** Timeslot của config Round mới (spec §4). */
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
  /** Null for manual/legacy rounds that were created without a Timeframe. */
  timeframeId: string | null;
  timeframeVersionId: string | null;
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
  /** "YYYY-MM-DD" — khoảng ngày sinh các ngày/slot chấm của Round. Deadline đăng ký độc lập và không sau startDate. */
  startDate: string;
  endDate: string;
  durationMinutes: number;
  reviewerCount: number;
  /** Null means there is no H13 cap for manual scheduling and validation. */
  maxGroupsPerTimeslot: number | null;
  registrationDeadline: string | null;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string | null;
  /** Lecturer và Leader đăng ký song song trong cùng phase REGISTRATION, dùng chung một deadline hiệu lực. */
  registrationPhase?: RegistrationPhase;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
  /** Null for manual/legacy rounds that were created without a Timeframe. */
  timeframeId: string | null;
  timeframeVersionId: string | null;
  days: RoundDay[];
}

interface RoundCreateBase {
  name: string;
  type: RoundType;
  description?: string;
  /** "YYYY-MM-DD" — bắt buộc: khoảng ngày sinh các ngày/slot chấm; deadline có thể nằm trước khoảng này. */
  startDate: string;
  endDate: string;
  durationMinutes: number;
  reviewerCount: number;
  maxGroupsPerTimeslot: number | null;
  registrationDeadline: string;
  groupSelectionMode: boolean;
  groupPreferenceDeadline?: string;
  resultOwnerMode: boolean;
  roomTypes: RoomType[];
}

export type RoundCreatePayload = RoundCreateBase &
  (
    | {
        /** Set only for the manual timeline branch. */
        days: RoundDayInput[];
        timeframeId?: never;
      }
    | {
        /** Selects an active reusable Timeframe. */
        timeframeId: number;
        days?: never;
      }
  );

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
  maxGroupsPerTimeslot?: number | null;
  registrationDeadline?: string;
  groupSelectionMode?: boolean;
  groupPreferenceDeadline?: string | null;
  resultOwnerMode?: boolean;
  roomTypes?: RoomType[];
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

export interface AttachedRoundGroup {
  groupId: string;
  groupCode: string;
  status: string;
  projectCode: string;
  title: string;
  activeMemberCount: number;
  leaderName: string | null;
  selectedSlotCount: number;
  /** FE dùng để ẩn nhóm khi hội đồng chấm có GVHD của chính nhóm đó. */
  supervisorIds: string[];
}

export interface AttachRoundResourcesPayload {
  groupIds: string[];
  timeslotIds: string[];
  roomTypes: RoomType[];
}

export interface RoundTimeslot {
  id: number;
  startAt: string;
  endAt: string;
  dayDate: string;
}

export interface RoundLecturerAvailabilityEntry {
  lecturerId: number;
  timeslotId: number;
  state: "AVAILABLE" | "UNAVAILABLE" | string;
  loadPreference: string | null;
  source: string;
}

export interface RoundGroupAvailabilityEntry {
  groupId: number;
  timeslotId: number;
  selected: boolean;
  source: string;
}

export interface RoundMyAvailabilityResponse {
  round: {
    id: number;
    type: RoundType;
    groupSelectionMode: boolean;
    registrationDeadline: string | null;
  };
  timeslots: RoundTimeslot[];
  /**
   * Chỉ có khi caller là ADMIN/MANAGER — audit view. BE xác nhận đây là mảng object
   * (không phải map theo id), lọc `state === "AVAILABLE"` để biết giảng viên rảnh slot đó.
   */
  selectedByLecturer?: RoundLecturerAvailabilityEntry[];
  selectedByGroup?: RoundGroupAvailabilityEntry[];
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

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(number) ? number : null;
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
  const roomTypes = pick(record, "roomTypes");
  return {
    id: asString(pick(record, "id")),
    name: asString(pick(record, "name")),
    type: pick(record, "type") as RoundType,
    status: pick(record, "status") as RoundStatus,
    durationMinutes: durationMinutes(record),
    reviewerCount: asNumber(pick(record, "reviewerCount")),
    startDate: asString(pick(record, "startDate")),
    endDate: asString(pick(record, "endDate")),
    registrationDeadline: asNullableString(
      pick(record, "registrationDeadline"),
    ),
    groupSelectionMode: asBoolean(
      pick(record, "groupSelectionMode"),
    ),
    groupPreferenceDeadline: asNullableString(
      pick(record, "groupPreferenceDeadline"),
    ),
    roomTypes: Array.isArray(roomTypes) ? roomTypes.filter(isRoomType) : [],
    timeframeId: asNullableString(pick(record, "timeframeId")),
    timeframeVersionId: asNullableString(pick(record, "timeframeVersionId")),
  };
}

function normalizeRoundDays(value: unknown): RoundDay[] {
  if (!Array.isArray(value)) return [];

  return value.map((day) => {
    const dayRecord = isRecord(day) ? day : {};
    const slots = pick(dayRecord, "slots");
    return {
      date: asString(pick(dayRecord, "date")),
      slots: Array.isArray(slots)
        ? slots.map((slot) => {
            const slotRecord = isRecord(slot) ? slot : {};
            return {
              id: asString(pick(slotRecord, "id")),
              startTime: asString(pick(slotRecord, "startTime")),
              endTime: asString(pick(slotRecord, "endTime")),
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
  const roomTypes = pick(record, "roomTypes");

  return {
    id: asString(pick(record, "id")),
    semesterId: asString(pick(record, "semesterId")),
    name: asString(pick(record, "name")),
    type: pick(record, "type") as RoundType,
    status: pick(record, "status") as RoundStatus,
    description: asString(pick(record, "description")),
    startDate: asString(pick(record, "startDate")),
    endDate: asString(pick(record, "endDate")),
    durationMinutes: durationMinutes(record),
    reviewerCount: asNumber(pick(record, "reviewerCount")),
    maxGroupsPerTimeslot: asNullableNumber(
      pick(record, "maxGroupsPerTimeslot"),
    ),
    registrationDeadline: asNullableString(
      pick(record, "registrationDeadline"),
    ),
    groupSelectionMode: asBoolean(
      pick(record, "groupSelectionMode"),
    ),
    groupPreferenceDeadline: asNullableString(
      pick(record, "groupPreferenceDeadline"),
    ),
    registrationPhase: pick(
      record,
      "registrationPhase",
    ) as RegistrationPhase | undefined,
    resultOwnerMode: asBoolean(
      pick(record, "resultOwnerMode"),
    ),
    roomTypes: Array.isArray(roomTypes) ? roomTypes.filter(isRoomType) : [],
    timeframeId: asNullableString(pick(record, "timeframeId")),
    timeframeVersionId: asNullableString(pick(record, "timeframeVersionId")),
    days: normalizeRoundDays(pick(record, "days")),
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
    pick(lecturerRecord, "id") ?? pick(record, "lecturerId"),
  );

  return {
    id: asString(pick(record, "id", "invitationId"), lecturerId),
    lecturer: {
      id: lecturerId,
      code: asString(
        pick(lecturerRecord, "code") ?? pick(record, "lecturerCode"),
      ),
      fullName: asString(
        pick(lecturerRecord, "fullName") ?? pick(record, "displayName"),
      ),
    },
    status: normalizeInvitationStatus(
      pick(record, "status"),
    ),
    availabilitySlotCount: asNumber(
      pick(record, "availableSlotCount", "availabilitySlotCount"),
    ),
    usedQuota: asNumber(pick(record, "usedQuota")),
    semesterQuota: asNumber(pick(record, "semesterQuota")),
  };
}

function normalizeEligibleProject(value: unknown): EligibleProjectRow {
  const record = isRecord(value) ? value : {};
  const checks = isRecord(pick(record, "checks"))
    ? (pick(record, "checks") as ApiRecord)
    : {};
  const blockingReasons = pick(record, "blockingReasons");
  const warnings = pick(record, "warnings");
  const groupId = asString(pick(record, "groupId"));

  return {
    projectId: asString(pick(record, "projectId"), groupId),
    groupId,
    eligible: asBoolean(pick(record, "eligible")),
    checks: {
      hasGroup: asBoolean(pick(checks, "hasGroup")),
      hasActiveLeader: asBoolean(
        pick(checks, "hasActiveLeader"),
      ),
      hasMainSupervisor: asBoolean(
        pick(checks, "hasMainSupervisor"),
      ),
      progressionAllowed: asBoolean(
        pick(checks, "progressionAllowed"),
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

function normalizeAttachedRoundGroup(value: unknown): AttachedRoundGroup {
  const record = isRecord(value) ? value : {};
  const supervisorIds = pick(record, "supervisorIds");
  return {
    groupId: asString(pick(record, "groupId")),
    groupCode: asString(pick(record, "groupCode")),
    status: asString(pick(record, "status")),
    projectCode: asString(pick(record, "projectCode")),
    title: asString(pick(record, "title")),
    activeMemberCount: asNumber(
      pick(record, "activeMemberCount"),
    ),
    leaderName: asNullableString(pick(record, "leaderName")),
    selectedSlotCount: asNumber(
      pick(record, "selectedSlotCount"),
    ),
    supervisorIds: Array.isArray(supervisorIds)
      ? supervisorIds
          .map((id) => asString(id))
          .filter((id) => id.length > 0)
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
        pick(lecturers, "availabilitySubmitted") ?? pick(record, "lecturerAvailability"),
      ),
      missing: asNumber(pick(lecturers, "missing")),
    },
    groups: {
      eligible: asNumber(
        pick(groups, "eligible") ??
        pick(record, "groupAvailability"),
      ),
      preferenceSubmitted: asNumber(
        pick(groups, "preferenceSubmitted"),
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
    const response = await apiService.get<unknown, { page?: number; pageSize?: number }>(
      `api/v1/semesters/${semesterId}/rounds`,
      params,
    );
    const payload = response.data;
    const metaRecord =
      isRecord(payload) && isRecord(payload.meta) ? payload.meta : undefined;
    const meta = metaRecord
      ? {
          page: asNumber(pick(metaRecord, "page")),
          pageSize: asNumber(pick(metaRecord, "pageSize")),
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
    const response = await apiService.post<{ data: RoundCreateResponse }, RoundCreatePayload>(
      `api/v1/semesters/${semesterId}/rounds`,
      payload,
    );
    return response.data.data;
  },

  /**
   * PATCH /rounds/:roundId — sửa cấu hình khi Round còn DRAFT/OPEN_REGISTRATION.
   * Response được bỏ qua; caller invalidate và refetch qua `getById`.
   */
  update: async (roundId: string, payload: RoundUpdatePayload): Promise<void> => {
    const body: Record<string, unknown> = {};
    if (payload.startDate !== undefined) body.startDate = payload.startDate;
    if (payload.endDate !== undefined) body.endDate = payload.endDate;
    if (payload.durationMinutes !== undefined) body.durationMinutes = payload.durationMinutes;
    if (payload.maxGroupsPerTimeslot !== undefined) body.maxGroupsPerTimeslot = payload.maxGroupsPerTimeslot;
    if (payload.registrationDeadline !== undefined) body.registrationDeadline = payload.registrationDeadline;
    if (payload.groupSelectionMode !== undefined) body.groupSelectionMode = payload.groupSelectionMode;
    if (payload.groupPreferenceDeadline !== undefined) body.groupPreferenceDeadline = payload.groupPreferenceDeadline;
    if (payload.resultOwnerMode !== undefined) body.resultOwnerMode = payload.resultOwnerMode;
    if (payload.roomTypes !== undefined) body.roomTypes = payload.roomTypes;
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

  /** GET /rounds/:roundId/groups — các nhóm Manager đã gắn vào Round. */
  groups: async (roundId: string): Promise<AttachedRoundGroup[]> => {
    const response = await apiService.get<unknown>(`api/v1/rounds/${roundId}/groups`);
    return asArray(response.data).map(normalizeAttachedRoundGroup);
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
      groupIds: payload.groupIds.map(toLegacyId),
      timeslotIds: payload.timeslotIds.map(toLegacyId),
      roomTypes: payload.roomTypes,
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
    const response = await apiService.get<RoundMyAvailabilityResponse>(`api/v1/rounds/${roundId}/my-availability`);
    return response.data;
  },
};
