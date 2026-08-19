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

export const fetchGroups = {
  /** GET /semesters/:semesterId/groups — spec §11/§41 */
  list: async (semesterId: string, params?: GroupListParams): Promise<{ data: GroupListItem[]; meta?: GroupListMeta }> => {
    const response = await apiService.get<{ data: GroupListItem[]; meta?: GroupListMeta }>(
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

  /** GET /groups/:groupId/members — spec §14 */
  members: async (groupId: string): Promise<GroupMemberDetail[]> => {
    const response = await apiService.get<{ data: GroupMemberDetail[] }>(`api/v1/groups/${groupId}/members`);
    return response.data.data;
  },

  /** POST /semesters/:semesterId/groups — spec §12/§42 */
  create: async (semesterId: string, payload: GroupCreatePayload): Promise<GroupCreateResponse> => {
    const response = await apiService.post<{ data: GroupCreateResponse }>(
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
