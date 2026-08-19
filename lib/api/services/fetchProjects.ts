import apiService from "../core";

export interface ProjectApiItem {
  id: number;
  code: string;
  title: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  semester_id: number;
  semester_code: string;
  major_code: string;
  supervisor_count: number;
  /** CHƯA CÓ Ở BACKEND, đề xuất tại manager-api.md §8.5 — tên/mã GVHD chính-phụ */
  supervisors?: { lecturer_code: string; display_name: string; type: "MAIN" | "CO" }[];
}

export interface ProjectCreatePayload {
  semester_id: number;
  major_id: number;
  code: string;
  title: string;
  /** "LECTURER_CODE:MAIN" | "LECTURER_CODE:CO" — 1–2 phần tử, đúng 1 MAIN */
  supervisors: string[];
}

export interface ProjectCreateResponse {
  id: number;
  code: string;
  title: string;
}

/** manager-api.md §10.3 PATCH — mọi field optional */
export interface ProjectUpdatePayload {
  code?: string;
  title?: string;
  /** "LECTURER_CODE:MAIN" | "LECTURER_CODE:CO" — 1–2 phần tử, đúng 1 MAIN */
  supervisors?: string[];
}

export interface ProjectUpdateResponse {
  id: number;
  code: string;
  title: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  semester_id: number;
}

export const fetchProjects = {
  /** GET /projects?semester_id= — ADMIN, MANAGER. Đã hỗ trợ ở backend (manager-api.md §8) */
  list: async (semesterId?: number | null): Promise<ProjectApiItem[]> => {
    const response = await apiService.get<ProjectApiItem[]>("api/v1/projects", {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** POST /projects — ADMIN, MANAGER */
  create: async (payload: ProjectCreatePayload): Promise<ProjectCreateResponse> => {
    const response = await apiService.post<ProjectCreateResponse>("api/v1/projects", payload);
    return response.data;
  },

  /** PATCH /projects/{project_id}?semester_id= — ADMIN, MANAGER. manager-api.md §5/§10.3 */
  update: async (
    projectId: number,
    payload: ProjectUpdatePayload,
    semesterId?: number | null
  ): Promise<ProjectUpdateResponse> => {
    const response = await apiService.patch<ProjectUpdateResponse>(`api/v1/projects/${projectId}`, payload, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },
};
