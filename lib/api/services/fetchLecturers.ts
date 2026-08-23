import apiService from "../core";
import { normalizeToSnakeCase } from "../compat";
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

export interface LecturerImportError {
  row: number;
  code: string;
  message?: string;
}

export interface LecturerImportAccount {
  row: number;
  lecturer_id: number;
  lecturer_code: string;
  email: string;
  display_name: string;
  temp_password: string;
}

export interface LecturerImportResponse {
  created: number;
  skipped: number;
  errors: LecturerImportError[];
  accounts: LecturerImportAccount[];
}

export const fetchLecturers = {
  /**
   * GET /lecturers — ADMIN, MANAGER.
   * BE trả `{data: [...camelCase], meta: {page,pageSize,total}}` qua success_payload()
   * (xem docs/be-checklist-open-questions.md mục 6) — unwrap + snakeize để khớp LecturerApiItem.
   */
  list: async (params?: LecturerListParams): Promise<ListResponse<LecturerApiItem>> => {
    const response = await apiService.get<{ data: unknown[]; meta?: ListMeta }, LecturerListParams>(
      "api/v1/lecturers",
      params
    );
    return { data: normalizeToSnakeCase<LecturerApiItem[]>(response.data.data), meta: response.data.meta };
  },

  /** POST /lecturers — ADMIN only, tạo account + lecturer trong 1 transaction */
  create: async (payload: LecturerCreatePayload): Promise<LecturerCreateResponse> => {
    const response = await apiService.post<unknown, LecturerCreatePayload>("api/v1/lecturers", payload);
    return normalizeToSnakeCase<LecturerCreateResponse>(response.data);
  },

  /** POST /lecturers/import — ADMIN, MANAGER. Nhận file .xlsx theo mẫu lecturers_template.xlsx. */
  importFile: async (file: File): Promise<LecturerImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiService.upload<unknown>("api/v1/lecturers/import", formData);
    return normalizeToSnakeCase<LecturerImportResponse>(response.data);
  },
};
