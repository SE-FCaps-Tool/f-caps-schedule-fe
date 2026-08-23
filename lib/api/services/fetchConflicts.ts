import apiService from "../core";

export interface ConflictCreatePayload {
  project_id: number;
  reason: string;
}

export interface ConflictCreateResponse {
  id: number;
  lecturer_id: number;
  project_id: number;
}

export const fetchConflicts = {
  /**
   * POST /lecturers/{lecturer_id}/conflicts — ADMIN, MANAGER, LECTURER.
   * Lecturer chỉ khai cho chính mình; Manager/Admin khai thay được. Dùng để loại
   * candidate Reviewer khi chạy scheduler (ràng buộc H8).
   */
  create: async (lecturerId: number, payload: ConflictCreatePayload): Promise<ConflictCreateResponse> => {
    const response = await apiService.post<ConflictCreateResponse, ConflictCreatePayload>(
      `api/v1/lecturers/${lecturerId}/conflicts`,
      payload
    );
    return response.data;
  },
};
