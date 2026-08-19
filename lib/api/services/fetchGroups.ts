import apiService from "../core";

export interface GroupApiItem {
  id: number;
  code: string;
  status: string;
  /** manager-api.md §10.3 — trạng thái hiển thị (khác `status` nghiệp vụ) */
  ui_status: string;
  project_code: string;
  title: string;
  active_member_count: number;
  leader_count: number;
  /** manager-api.md §10.3 — tên leader hiện tại, null nếu chưa có */
  leader_name: string | null;
}

export interface GroupMemberPayload {
  student_code: string;
  role?: "LEADER" | "MEMBER";
}

export interface GroupCreatePayload {
  project_id: number;
  code: string;
  /** 4–5 phần tử, đúng 1 LEADER (BR-GRP-02, BR-GRP-03) */
  members: GroupMemberPayload[];
}

export interface GroupCreateResponse {
  id: number;
  code: string;
  member_count: number;
}

export interface DropMemberPayload {
  reason: string;
}

export interface DropMemberResponse {
  group_id: number;
  student_id: number;
  status: "DROPPED";
  warning?: "GROUP_BELOW_MINIMUM_MAY_CONTINUE";
}

export interface SetLeaderPayload {
  student_id: number;
  reason: string;
}

export interface SetLeaderResponse {
  group_id: number;
  leader_student_id: number;
}

export interface GroupMemberDetail {
  student_id: number;
  student_code: string;
  display_name: string;
  role: "LEADER" | "MEMBER";
  status: string;
}

export interface GroupDetail {
  id: number;
  code: string;
  status: string;
  project_id: number;
  project_code: string;
  title: string;
  members: GroupMemberDetail[];
}

export const fetchGroups = {
  /** GET /groups?semester_id= — ADMIN, MANAGER. Đã hỗ trợ ở backend (manager-api.md §8) */
  list: async (semesterId?: number | null): Promise<GroupApiItem[]> => {
    const response = await apiService.get<GroupApiItem[]>("api/v1/groups", {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** POST /groups — ADMIN, MANAGER */
  create: async (payload: GroupCreatePayload): Promise<GroupCreateResponse> => {
    const response = await apiService.post<GroupCreateResponse>("api/v1/groups", payload);
    return response.data;
  },

  /** GET /groups/{group_id}?semester_id= — ADMIN, MANAGER. manager-api.md §5/§10.3, dùng cho picker thành viên */
  getById: async (groupId: number, semesterId?: number | null): Promise<GroupDetail> => {
    const response = await apiService.get<GroupDetail>(`api/v1/groups/${groupId}`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** POST /groups/{group_id}/members/{student_id}/drop — ADMIN, MANAGER */
  dropMember: async (
    groupId: number,
    studentId: number,
    payload: DropMemberPayload
  ): Promise<DropMemberResponse> => {
    const response = await apiService.post<DropMemberResponse>(
      `api/v1/groups/${groupId}/members/${studentId}/drop`,
      payload
    );
    return response.data;
  },

  /** POST /groups/{group_id}/leader — ADMIN, MANAGER */
  setLeader: async (groupId: number, payload: SetLeaderPayload): Promise<SetLeaderResponse> => {
    const response = await apiService.post<SetLeaderResponse>(`api/v1/groups/${groupId}/leader`, payload);
    return response.data;
  },
};
