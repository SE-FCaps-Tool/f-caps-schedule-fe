/**
 * Shim đọc-hai-kiểu cho giai đoạn chuyển tiếp camelCase (Phase 6 của
 * plans/260823-1441-api-camelcase-convention). BE hiện có 2 thế hệ route sống song song:
 * route "target" (qua success_payload()) đã trả camelCase, route "legacy" còn trả
 * snake_case cho cùng resource. Sau Phase 7 mọi route trả camelCase.
 *
 * Các service (fetchSemesters/fetchLecturers/fetchRooms/fetchReports/fetchResults) đang
 * khai DTO snake_case dùng ở hàng chục component FE (xem reports/fe-touchpoints.md mục A).
 * Đổi 27 component đó sang camelCase là việc của Phase 8. Cho tới lúc đó, hàm dưới đây
 * chuẩn hoá MỌI response về snake_case bất kể route đang ở thế hệ nào, để consumer không
 * phải đổi. Đây là bản thay thế cho `lib/api/caseConvert.ts` (đã xoá) — không lossy với key
 * kiểu ALL-CAPS (enum value dùng làm key, vd `{ACTIVE: 5}`), vì bản cũ coi mọi chữ hoa là một
 * ranh giới từ và phá cả key đó.
 *
 * Guard đối xứng với `_camel_case_key()` phía BE (apps/api/app/api_contract.py) — bên đó chỉ
 * camel hoá key khớp trọn `SNAKE_KEY`, bên này chỉ snake hoá key khớp trọn `CAMEL_KEY`.
 */
const CAMEL_KEY = /^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/;

function toSnakeCaseKey(key: string): string {
  if (!CAMEL_KEY.test(key)) return key;
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Chuẩn hoá key về snake_case, đệ quy qua object/array. No-op nếu key đã là snake_case,
 * ALL-CAPS, hoặc không phải camelCase hợp lệ — chỉ giá trị (không phải key) mới giữ nguyên
 * dạng gốc (vd enum "ACTIVE" không bị đụng vì nó là value, không phải key).
 */
export function normalizeToSnakeCase<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeToSnakeCase(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[toSnakeCaseKey(key)] = normalizeToSnakeCase(val);
    }
    return result as T;
  }
  return value as T;
}
