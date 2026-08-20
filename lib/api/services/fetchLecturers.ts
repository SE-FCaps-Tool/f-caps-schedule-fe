import apiService from "../core";
import { snakeizeKeys } from "../caseConvert";
import type { ListMeta, ListResponse } from "@/types/api";

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
   * BE trả `{data: [...camelCase], meta: {page,pageSize,total}}` qua success_payload()
   * (xem docs/be-checklist-open-questions.md mục 6) — unwrap + snakeize để khớp LecturerApiItem.
   */
  list: async (params?: LecturerListParams): Promise<ListResponse<LecturerApiItem>> => {
    const response = await apiService.get<{ data: unknown[]; meta?: ListMeta }>("api/v1/lecturers", params);
    return { data: snakeizeKeys<LecturerApiItem[]>(response.data.data), meta: response.data.meta };
  },

  /** POST /lecturers — ADMIN only, tạo account + lecturer trong 1 transaction */
  create: async (payload: LecturerCreatePayload): Promise<LecturerCreateResponse> => {
    const response = await apiService.post<LecturerCreateResponse>("api/v1/lecturers", payload);
    return response.data;
  },
};
