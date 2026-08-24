import apiService from "../core";

export interface ConflictCreatePayload {
  projectId: number;
  reason: string;
}

export interface ConflictCreateResponse {
  id: number;
  lecturerId: number;
  projectId: number;
}

export const fetchConflicts = {
  /**
   * POST /lecturers/{lecturerId}/conflicts — ADMIN, MANAGER, LECTURER.
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
