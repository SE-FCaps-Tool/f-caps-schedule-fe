import apiService from "../core";

export type SemesterStatus = "UPCOMING" | "ACTIVE" | "CLOSED";

export interface SemesterApiItem {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SemesterStatus;
  created_at: string;
}

export interface SemesterCreatePayload {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface SemesterTransitionPayload {
  target_status: SemesterStatus;
  reason: string;
}

export const fetchSemesters = {
  /** GET /semesters — ADMIN, MANAGER */
  list: async (): Promise<SemesterApiItem[]> => {
    const response = await apiService.get<SemesterApiItem[]>("api/v1/semesters");
    return response.data;
  },

  /**
   * POST /semesters — backend luôn tạo với status UPCOMING (client không
   * chọn được trạng thái). Thời lượng end_date - start_date + 1 phải nằm
   * trong [SEMESTER_MIN_DURATION_DAYS, SEMESTER_MAX_DURATION_DAYS] (mặc
   * định 105–120 ngày), nếu không backend trả 422 SEMESTER_DURATION_INVALID.
   */
  create: async (payload: SemesterCreatePayload): Promise<SemesterApiItem> => {
    const response = await apiService.post<SemesterApiItem>("api/v1/semesters", payload);
    return response.data;
  },

  /**
   * POST /semesters/{id}/transition — chỉ ADMIN/MANAGER, chỉ cho phép
   * UPCOMING -> ACTIVE hoặc ACTIVE -> CLOSED (không lùi/nhảy bước), chỉ
   * một semester ACTIVE tại một thời điểm.
   */
  transition: async (
    id: number,
    payload: SemesterTransitionPayload
  ): Promise<Pick<SemesterApiItem, "id" | "status">> => {
    const response = await apiService.post<Pick<SemesterApiItem, "id" | "status">>(
      `api/v1/semesters/${id}/transition`,
      payload
    );
    return response.data;
  },
};
