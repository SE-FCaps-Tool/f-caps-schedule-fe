import type { ApiResponse } from "@/types/api";
import type { Semester } from "@/types/models";
import apiService from "../core";

// Mẫu service theo pattern fetchXxx.ts — tham chiếu FR-2.1
export const fetchSemester = {
  getList: async () => (await apiService.get<ApiResponse<Semester[]>>("api/v1/semesters")).data,

  getActive: async () =>
    (await apiService.get<ApiResponse<Semester>>("api/v1/semesters/active")).data,

  getById: async (id: string) =>
    (await apiService.get<ApiResponse<Semester>>(`api/v1/semesters/${id}`)).data,

  create: async (data: Partial<Semester>) =>
    (await apiService.post<ApiResponse<Semester>>("api/v1/semesters", data)).data,

  update: async (id: string, data: Partial<Semester>) =>
    (await apiService.put<ApiResponse<Semester>>(`api/v1/semesters/${id}`, data)).data,
};
