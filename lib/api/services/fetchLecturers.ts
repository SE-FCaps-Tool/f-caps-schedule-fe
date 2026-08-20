import apiService from "../core";

export interface LecturerConflict {
  project_id: number;
  reason: string;
}

export interface LecturerApiItem {
  id: number;
  lecturer_code: string;
  account_id: number;
  email: string;
  display_name: string;
  account_status: "ACTIVE" | "INACTIVE";
  conflicts: LecturerConflict[];
}

export interface LecturerCreatePayload {
  lecturer_code: string;
  email: string;
  display_name: string;
  password: string;
}

export interface LecturerCreateResponse {
  id: number;
  lecturer_code: string;
  account_id: number;
}

export interface LecturerListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const fetchLecturers = {
  /**
   * GET /lecturers — ADMIN, MANAGER.
   * `page`/`pageSize`/`search` gửi sẵn theo hợp đồng ListResponse<T> — BE hiện chưa hỗ trợ
   * (luôn trả mảng phẳng đầy đủ), FE tự cắt trang qua lib/api/pagination.ts normalizeListResponse
   * cho tới khi BE bổ sung `meta`. Xem docs/manager-fe-migration-phases.md cho danh sách API cần bổ sung.
   */
  list: async (params?: LecturerListParams): Promise<LecturerApiItem[]> => {
    const response = await apiService.get<LecturerApiItem[]>("api/v1/lecturers", params);
    return response.data;
  },

  /** POST /lecturers — ADMIN only, tạo account + lecturer trong 1 transaction */
  create: async (payload: LecturerCreatePayload): Promise<LecturerCreateResponse> => {
    const response = await apiService.post<LecturerCreateResponse>("api/v1/lecturers", payload);
    return response.data;
  },
};
