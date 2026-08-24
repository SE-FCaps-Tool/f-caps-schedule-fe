import apiService from "../core";
import type { ListMeta, ListResponse } from "@/types/api";

export interface LecturerConflict {
  projectId: number;
  reason: string;
}

export interface LecturerApiItem {
  id: number;
  lecturerCode: string;
  accountId: number;
  email: string;
  displayName: string;
  accountStatus: "ACTIVE" | "INACTIVE";
  conflicts: LecturerConflict[];
}

export interface LecturerCreatePayload {
  lecturerCode: string;
  email: string;
  displayName: string;
  password: string;
}

export interface LecturerCreateResponse {
  id: number;
  lecturerCode: string;
  accountId: number;
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
  lecturerId: number;
  lecturerCode: string;
  email: string;
  displayName: string;
  tempPassword: string;
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
   * Response đã là camelCase theo contract BE.
   */
  list: async (params?: LecturerListParams): Promise<ListResponse<LecturerApiItem>> => {
    const response = await apiService.get<{ data: LecturerApiItem[]; meta?: ListMeta }, LecturerListParams>(
      "api/v1/lecturers",
      params
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  /** POST /lecturers — ADMIN only, tạo account + lecturer trong 1 transaction */
  create: async (payload: LecturerCreatePayload): Promise<LecturerCreateResponse> => {
    const response = await apiService.post<LecturerCreateResponse, LecturerCreatePayload>("api/v1/lecturers", payload);
    return response.data;
  },

  /** POST /lecturers/import — ADMIN, MANAGER. Nhận file .xlsx theo mẫu lecturers_template.xlsx. */
  importFile: async (file: File): Promise<LecturerImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiService.upload<LecturerImportResponse>("api/v1/lecturers/import", formData);
    return response.data;
  },
};
