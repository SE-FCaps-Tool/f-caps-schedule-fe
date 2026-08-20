import apiService from "../core";
import { snakeizeKeys } from "../caseConvert";
import type { ListMeta, ListResponse } from "@/types/api";

/**
 * 4 trạng thái theo docs/capstone-fe-be-implementation-spec.md §1 (spec đích — BE sẽ
 * viết lại theo đây). Route/payload CRUD Semester chưa được spec đó liệt kê cụ thể nên
 * vẫn giữ nguyên như bên dưới cho tới khi BE xác nhận; chỉ enum trạng thái đổi trước.
 * PLANNING: chuẩn bị enrollment/group/project, chưa tạo được EvaluationRound.
 * ARCHIVED: chỉ đọc.
 */
export type SemesterStatus = "PLANNING" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export interface SemesterActor {
  id: number;
  email: string;
  display_name: string;
}

export interface SemesterApiItem {
  id: number;
  code: string;
  name: string;
  note: string | null;
  start_date: string;
  end_date: string;
  /** "YYYY-YYYY", backend tự suy ra từ start_date */
  academic_year: string;
  status: SemesterStatus;
  project_count: number;
  group_count: number;
  round_count: number;
  created_at: string;
  created_by: SemesterActor | null;
  updated_at: string;
  updated_by: SemesterActor | null;
}

export interface SemesterListParams {
  search?: string;
  status?: SemesterStatus;
  /** "YYYY-YYYY" */
  academicYear?: string;
  page?: number;
  pageSize?: number;
}

export interface SemesterCreatePayload {
  code: string;
  name: string;
  /** Optional — backend tự set status=ACTIVE và suy ra academic_year, không truyền trong request */
  note?: string;
  start_date: string;
  end_date: string;
}

/** PATCH /semesters/{id} — mọi field optional, không sửa được status trực tiếp */
export interface SemesterUpdatePayload {
  code?: string;
  name?: string;
  note?: string;
  start_date?: string;
  end_date?: string;
}

export interface SemesterTransitionPayload {
  /** Chỉ ACTIVE -> CLOSED hợp lệ */
  target_status: "CLOSED";
  reason: string;
}

export const fetchSemesters = {
  /**
   * GET /semesters — ADMIN, MANAGER. Hỗ trợ search/status/academic_year filter.
   * BE trả `{data: [...camelCase], meta: {page,pageSize,total}}` qua success_payload()
   * (xem docs/be-checklist-open-questions.md mục 6) — unwrap + snakeize để khớp SemesterApiItem.
   */
  list: async (params?: SemesterListParams): Promise<ListResponse<SemesterApiItem>> => {
    const response = await apiService.get<{ data: unknown[]; meta?: ListMeta }>("api/v1/semesters", {
      search: params?.search || undefined,
      status: params?.status,
      academic_year: params?.academicYear || undefined,
      page: params?.page,
      pageSize: params?.pageSize,
    });
    return { data: snakeizeKeys<SemesterApiItem[]>(response.data.data), meta: response.data.meta };
  },

  /** GET /semesters/{id} — ADMIN, MANAGER */
  getById: async (id: number): Promise<SemesterApiItem> => {
    const response = await apiService.get<SemesterApiItem>(`api/v1/semesters/${id}`);
    return response.data;
  },

  /**
   * POST /semesters — backend luôn tạo với status ACTIVE. Tạo mới khi đã có
   * semester ACTIVE khác trả 409 ACTIVE_SEMESTER_EXISTS. Thời lượng
   * end_date - start_date + 1 phải nằm trong [105, 120] ngày, nếu không
   * backend trả 422 SEMESTER_DURATION_INVALID.
   */
  create: async (payload: SemesterCreatePayload): Promise<SemesterApiItem> => {
    const response = await apiService.post<SemesterApiItem>("api/v1/semesters", payload);
    return response.data;
  },

  /** PATCH /semesters/{id} — ADMIN, MANAGER. Sửa ngày sẽ tính lại academic_year và kiểm tra duration */
  update: async (id: number, payload: SemesterUpdatePayload): Promise<SemesterApiItem> => {
    const response = await apiService.patch<SemesterApiItem>(`api/v1/semesters/${id}`, payload);
    return response.data;
  },

  /** POST /semesters/{id}/transition — chỉ ADMIN/MANAGER, chỉ ACTIVE -> CLOSED */
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

  /**
   * POST /semesters/{id}/set-current — ADMIN, MANAGER. Nếu target đang CLOSED,
   * backend tự đóng semester ACTIVE hiện tại rồi mở target (transaction +
   * advisory lock). Nếu target đã ACTIVE thì idempotent, chỉ trả lại resource.
   */
  setCurrent: async (id: number): Promise<SemesterApiItem> => {
    const response = await apiService.post<SemesterApiItem>(`api/v1/semesters/${id}/set-current`, undefined);
    return response.data;
  },
};
