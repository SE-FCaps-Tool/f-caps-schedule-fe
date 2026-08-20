/**
 * BE trả field camelCase cho các endpoint đi qua `success_payload()` (vd. /semesters,
 * /lecturers, /rooms — xem docs/be-checklist-open-questions.md mục 6), trong khi type FE
 * hiện có (SemesterApiItem, LecturerApiItem, RoomApiItem...) khai báo snake_case và được
 * dùng ở rất nhiều nơi trong app. Convert ngay tại service layer để không phải đổi field
 * name ở mọi call site.
 */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeizeKeys<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => snakeizeKeys(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[toSnakeCase(key)] = snakeizeKeys(val);
    }
    return result as T;
  }
  return value as T;
}
