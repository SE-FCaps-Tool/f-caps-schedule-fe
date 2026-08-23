import apiService from "../core";

export interface MajorApiItem {
  id: number;
  code: string;
  name: string;
}

export interface StudentApiItem {
  id: number;
  student_code: string;
  /** Chưa có trong docs/master-data.md (GET /students hiện chỉ trả {id, student_code}) — optional cho tới khi BE bổ sung */
  full_name?: string;
  email?: string;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lấy giá trị đầu tiên có mặt trong các tên field ứng viên. */
function pick(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  return undefined;
}

/**
 * Repo đang tồn tại song song 2 quy ước: endpoint cũ trả snake_case, endpoint đã migrate trả
 * camelCase bọc trong `{data}` (xem docs/be-checklist-open-questions.md mục 6). `GET /students`
 * chưa chốt kiểu nào, nên nhận cả hai thay vì để tên sinh viên render rỗng nếu BE chọn khác kiểu.
 */
function normalizeStudent(value: unknown): StudentApiItem {
  const record = isRecord(value) ? value : {};
  const fullName = pick(record, "full_name", "fullName", "display_name", "displayName", "name");
  const email = pick(record, "email");

  return {
    id: Number(pick(record, "id", "student_id", "studentId") ?? 0),
    student_code: String(pick(record, "student_code", "studentCode", "code") ?? ""),
    ...(fullName === undefined ? {} : { full_name: String(fullName) }),
    ...(email === undefined ? {} : { email: String(email) }),
  };
}

export const fetchMasterDataLookups = {
  /** GET /majors — ADMIN, MANAGER */
  majors: async (): Promise<MajorApiItem[]> => {
    const response = await apiService.get<MajorApiItem[]>("api/v1/majors");
    return response.data;
  },

  /** GET /students — ADMIN, MANAGER. Xem be-checklist mục A11: BE cần bổ sung full_name/email. */
  students: async (): Promise<StudentApiItem[]> => {
    const response = await apiService.get<unknown>("api/v1/students");
    const payload = response.data;
    // Chấp nhận cả mảng phẳng (hiện tại) lẫn `{data: [...]}` nếu BE migrate sang success_payload().
    const rows = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];
    return rows.map(normalizeStudent);
  },
};
