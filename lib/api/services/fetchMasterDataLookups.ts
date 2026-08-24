import apiService from "../core";

export interface MajorApiItem {
  id: number;
  code: string;
  name: string;
}

export interface StudentApiItem {
  id: number;
  studentCode: string;
  /** Optional until BE includes the student's display name. */
  fullName?: string;
  email?: string;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStudent(value: unknown): StudentApiItem {
  const record = isRecord(value) ? value : {};
  const fullName = record.fullName;
  const email = record.email;

  return {
    id: Number(record.id ?? 0),
    studentCode: String(record.studentCode ?? ""),
    ...(fullName === undefined ? {} : { fullName: String(fullName) }),
    ...(email === undefined ? {} : { email: String(email) }),
  };
}

export const fetchMasterDataLookups = {
  /** GET /majors — ADMIN, MANAGER */
  majors: async (): Promise<MajorApiItem[]> => {
    const response = await apiService.get<MajorApiItem[]>("api/v1/majors");
    return response.data;
  },

  /** GET /students — ADMIN, MANAGER. */
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
