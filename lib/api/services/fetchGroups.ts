import apiService from "../core";

/** capstone-fe-be-implementation-spec.md §2 — organizational lifecycle, khác ProjectStatus (academic progression) */
export type GroupStatus = "FORMING" | "FORMED" | "ASSIGNED" | "DISBANDED";

export type GroupMemberRole = "LEADER" | "MEMBER";

export type GroupMembershipStatus = "ACTIVE" | "LEFT";

export interface GroupWarning {
  code: string;
  message: string;
}

export interface GroupListItem {
  id: string;
  code: string;
  status: GroupStatus;
  memberCount: number;
  leader: {
    id: string;
    code: string;
    fullName: string;
  } | null;
  project: {
    id: string;
    code: string;
    name: string;
    nameVi: string;
    nameEn: string | null;
    status: string;
  } | null;
  warnings: GroupWarning[];
}

export interface GroupListParams {
  search?: string;
  status?: GroupStatus;
  hasProject?: boolean;
  hasLeader?: boolean;
  warning?: string;
  page?: number;
  pageSize?: number;
}

export interface GroupListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface GroupCreatePayload {
  code: string;
  studentIds: string[];
  leaderId?: string;
}

export interface GroupCreateResponse {
  id: string;
  code: string;
  status: GroupStatus;
}

export interface GroupMemberDetail {
  membershipId: string;
  studentId: string;
  studentCode: string;
  fullName: string;
  role: GroupMemberRole;
  status: GroupMembershipStatus;
  leftAt?: string | null;
}

export interface GroupDetail {
  id: string;
  code: string;
  status: GroupStatus;
  leaderId: string | null;
  currentMemberCount: number;
  initialMemberCount: number;
  project: {
    id: string;
    code: string;
    name: string;
    status: string;
    mainSupervisor: { id: string; code: string; fullName: string } | null;
    coSupervisor: { id: string; code: string; fullName: string } | null;
  } | null;
}

export interface GroupOverviewMember {
  membershipId: number;
  studentId: number;
  studentCode: string;
  fullName: string | null;
  role: GroupMemberRole;
  status: GroupMembershipStatus;
  leftAt: string | null;
}

export interface GroupOverview {
  id: number;
  code: string;
  status: string;
  semester: { id: number; code: string; name: string } | null;
  memberCount: number;
  leader: GroupOverviewMember | null;
  members: GroupOverviewMember[];
  project: {
    id: number;
    code: string;
    name: string;
    status: string;
    mainSupervisor: { id: number; code: string; fullName: string | null } | null;
    coSupervisor: { id: number; code: string; fullName: string | null } | null;
  } | null;
  progress: {
    groupStatus: string;
    rounds: Array<{
      roundId: number;
      roundType: string;
      roundStatus: string;
      sessionId: number | null;
      sessionStatus: string | null;
      scheduledAt: string | null;
      roomCode: string | null;
      result: {
        id: number;
        outcome: string;
        note: string | null;
        enteredAt: string;
        verifyStatus: string | null;
      } | null;
    }>;
  };
  remediation: {
    id: number;
    status: string;
    dueAt: string;
    verifierLecturerId: number | null;
    note: string | null;
    roundType: string;
  } | null;
  warnings: GroupWarning[];
}

export interface ChangeLeaderPayload {
  leaderId: string;
  reason: string;
}

export interface MemberLeavePayload {
  /** "YYYY-MM-DD" */
  effectiveDate: string;
  reason: string;
}

export interface AssignProjectPayload {
  projectId: string;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  return undefined;
}

/**
 * Spec (§14) chỉ vẽ bảng "MSSV / Họ tên / Vai trò / Trạng thái", không có JSON mẫu — FE tự đặt
 * camelCase. Họ tên có thể nằm trong `student` theo contract của legacy members endpoint.
 */
let warnedMissingMemberName = false;

function normalizeMember(value: unknown): GroupMemberDetail {
  const record = isRecord(value) ? value : {};
  const student = isRecord(pick(record, "student")) ? (pick(record, "student") as ApiRecord) : {};

  const fullName =
    pick(record, "fullName", "displayName", "name", "studentName") ??
    pick(student, "fullName", "displayName", "name");

  // Danh sách key ở trên là suy đoán. Nếu không khớp, in ra key thật BE trả (1 lần) để biết
  // phải bổ sung tên nào, thay vì im lặng hiển thị mỗi MSSV.
  if (fullName === undefined && !warnedMissingMemberName && process.env.NODE_ENV !== "production") {
    warnedMissingMemberName = true;
    console.warn(
      "[fetchGroups.members] Không tìm thấy họ tên trong response. Key BE thực tế trả:",
      Object.keys(record),
      isRecord(record.student) ? { student: Object.keys(record.student as ApiRecord) } : "",
    );
  }

  return {
    membershipId: String(pick(record, "membershipId", "id") ?? ""),
    studentId: String(pick(record, "studentId") ?? pick(student, "id") ?? ""),
    studentCode: String(pick(record, "studentCode", "code") ?? pick(student, "code", "studentCode") ?? ""),
    // Để rỗng thay vì "undefined" — UI tự bỏ phần tên khi không có.
    fullName: fullName === undefined ? "" : String(fullName),
    role: (pick(record, "role") as GroupMemberRole) ?? "MEMBER",
    status: (pick(record, "status", "membershipStatus") as GroupMembershipStatus) ?? "ACTIVE",
    leftAt: (pick(record, "leftAt") as string | undefined) ?? null,
  };
}

/** "MSSV — Họ tên", bỏ phần tên khi BE chưa trả để không in ra chữ "undefined". */
export function groupMemberLabel(member: GroupMemberDetail): string {
  return member.fullName ? `${member.studentCode} — ${member.fullName}` : member.studentCode;
}

export const fetchGroups = {
  /** GET /semesters/:semesterId/groups — spec §11/§41 */
  list: async (semesterId: string, params?: GroupListParams): Promise<{ data: GroupListItem[]; meta?: GroupListMeta }> => {
    const response = await apiService.get<{ data: GroupListItem[]; meta?: GroupListMeta }, GroupListParams>(
      `api/v1/semesters/${semesterId}/groups`,
      params
    );
    return response.data;
  },

  /** GET /groups/:groupId — spec §13 */
  getById: async (groupId: string): Promise<GroupDetail> => {
    const response = await apiService.get<{ data: GroupDetail }>(`api/v1/groups/${groupId}`);
    return response.data.data;
  },

  /** GET /groups/:groupId/overview — Group 360 read model */
  overview: async (groupId: string): Promise<GroupOverview> => {
    const response = await apiService.get<{ data: GroupOverview }>(`api/v1/groups/${groupId}/overview`);
    return response.data.data;
  },

  /** GET /groups/:groupId/members — spec §14 */
  members: async (groupId: string): Promise<GroupMemberDetail[]> => {
    const response = await apiService.get<unknown>(`api/v1/groups/${groupId}/members`);
    const payload = response.data;
    const rows = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];
    return rows.map(normalizeMember);
  },

  /** POST /semesters/:semesterId/groups — spec §12/§42 */
  create: async (semesterId: string, payload: GroupCreatePayload): Promise<GroupCreateResponse> => {
    const response = await apiService.post<{ data: GroupCreateResponse }, GroupCreatePayload>(
      `api/v1/semesters/${semesterId}/groups`,
      payload
    );
    return response.data.data;
  },

  /** POST /groups/:groupId/actions/change-leader — spec §14/§43 */
  changeLeader: async (groupId: string, payload: ChangeLeaderPayload): Promise<void> => {
    await apiService.post(`api/v1/groups/${groupId}/actions/change-leader`, payload);
  },

  /** POST /groups/:groupId/members/:membershipId/actions/leave — spec §14/§44 */
  memberLeave: async (groupId: string, membershipId: string, payload: MemberLeavePayload): Promise<void> => {
    await apiService.post(`api/v1/groups/${groupId}/members/${membershipId}/actions/leave`, payload);
  },

  /** PUT /groups/:groupId/project — spec §15/§45 */
  assignProject: async (groupId: string, payload: AssignProjectPayload): Promise<void> => {
    await apiService.put(`api/v1/groups/${groupId}/project`, payload);
  },
};
