import apiService from "../core";
import type { RoundType } from "./fetchRounds";

/** capstone-fe-be-implementation-spec.md §3 — academic progression, BE tự transition, FE chỉ hiển thị */
export type ProjectStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ELIGIBLE_D12"
  | "D12_CONDITIONAL"
  | "PENDING_D2"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type SupervisorRole = "MAIN" | "CO";

export interface ProjectSupervisor {
  id: string;
  code: string;
  fullName: string;
}

export interface ProjectListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  status: ProjectStatus;
  mainSupervisor: ProjectSupervisor | null;
  coSupervisor: ProjectSupervisor | null;
  group: { id: string; code: string } | null;
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus;
  supervisorId?: string;
  hasGroup?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProjectListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ProjectCreatePayload {
  code: string;
  nameVi: string;
  nameEn?: string;
  mainSupervisorId: string;
  coSupervisorId?: string;
}

export interface ProjectCreateResponse {
  id: string;
  code: string;
  nameVi: string;
  status: ProjectStatus;
}

export interface ProjectUpdatePayload {
  nameVi?: string;
  nameEn?: string | null;
  mainSupervisorId: string;
  coSupervisorId?: string;
}

export interface ProjectDetail {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  status: ProjectStatus;
  mainSupervisor: ProjectSupervisor | null;
  coSupervisor: ProjectSupervisor | null;
  group: { id: string; code: string; memberCount: number; leader: { id: string; fullName: string } | null } | null;
}

/** spec §18 — UI progression: chuỗi mốc Review/Defense + trạng thái hiện tại + remediation nếu có */
export interface ProjectProgressionEntry {
  round: RoundType;
  result: string | null;
}

export interface ProjectProgression {
  status: ProjectStatus;
  timeline: ProjectProgressionEntry[];
  remediation: {
    status: string;
    deadline: string;
    verifierId: string;
  } | null;
}

export interface ProjectResultEntry {
  sessionId: string;
  round: RoundType;
  result: string;
  note: string | null;
  submittedAt: string;
}

export const fetchProjects = {
  /** GET /semesters/:semesterId/projects — spec §16/§46 */
  list: async (
    semesterId: string,
    params?: ProjectListParams
  ): Promise<{ data: ProjectListItem[]; meta?: ProjectListMeta }> => {
    const response = await apiService.get<{ data: ProjectListItem[]; meta?: ProjectListMeta }>(
      `api/v1/semesters/${semesterId}/projects`,
      params
    );
    return response.data;
  },

  /** POST /semesters/:semesterId/projects — spec §17/§47. Trạng thái khởi tạo luôn DRAFT */
  create: async (semesterId: string, payload: ProjectCreatePayload): Promise<ProjectCreateResponse> => {
    const response = await apiService.post<{ data: ProjectCreateResponse }>(
      `api/v1/semesters/${semesterId}/projects`,
      payload
    );
    return response.data.data;
  },

  /** PATCH /projects/:projectId — đổi tên/GVHD của đề tài */
  update: async (projectId: string, payload: ProjectUpdatePayload): Promise<void> => {
    await apiService.patch(`api/v1/projects/${projectId}`, payload);
  },

  /** GET /projects/:projectId — spec §18 */
  getById: async (projectId: string): Promise<ProjectDetail> => {
    const response = await apiService.get<{ data: ProjectDetail }>(`api/v1/projects/${projectId}`);
    return response.data.data;
  },

  /** GET /projects/:projectId/progression — spec §18/§75 */
  progression: async (projectId: string): Promise<ProjectProgression> => {
    const response = await apiService.get<{ data: ProjectProgression }>(`api/v1/projects/${projectId}/progression`);
    return response.data.data;
  },

  /** GET /projects/:projectId/results — spec §18 */
  results: async (projectId: string): Promise<ProjectResultEntry[]> => {
    const response = await apiService.get<{ data: ProjectResultEntry[] }>(`api/v1/projects/${projectId}/results`);
    return response.data.data;
  },

  // Chưa migrate: spec chưa liệt kê PATCH /projects/:projectId (sửa code/tên/đổi GVHD sau khi tạo).
};
