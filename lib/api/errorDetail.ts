import type { ApiError } from "@/types/api";

/**
 * Hai shape lỗi cùng tồn tại trong giai đoạn migrate sang
 * docs/capstone-fe-be-implementation-spec.md (PHẦN VI/XVI):
 * - Cũ (docs/manager-api.md và các endpoint chưa migrate): { detail: { code, message, violations } }
 * - Mới (spec đích, endpoint đã migrate):                  { error: { code, message, details } }
 * Đọc cả hai, ưu tiên `error` (mới) nếu cùng có mặt.
 */
interface ErrorDetail {
  detail?: { code?: string; message?: string; violations?: unknown[] };
  error?: { code?: string; message?: string; details?: unknown };
}

export function detailCode(error: ApiError): string | undefined {
  const data = error.data as ErrorDetail | undefined;
  return data?.error?.code ?? data?.detail?.code;
}

export function detailMessage(error: ApiError): string | undefined {
  const data = error.data as ErrorDetail | undefined;
  return data?.error?.message ?? data?.detail?.message;
}

export function detailViolations(error: ApiError): unknown[] | undefined {
  return (error.data as ErrorDetail | undefined)?.detail?.violations;
}

/** `error.details` (shape mới) — object tự do tuỳ endpoint (vd field lỗi cụ thể). */
export function detailDetails(error: ApiError): unknown {
  return (error.data as ErrorDetail | undefined)?.error?.details;
}

/**
 * Map `code` → thông báo tiếng Việt dễ hiểu cho người dùng cuối.
 * Phủ cả mã cũ đã thấy thực tế từ backend/docs/*.md lẫn mã mới trong
 * capstone-fe-be-implementation-spec.md §PHẦN XVI. Mã lạ sẽ rơi xuống
 * `detail.message`/`error.message` gốc, không hiện code kỹ thuật cho manager.
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  // --- Chung / cũ (docs/manager-api.md, docs/role-api-matrix.md) ---
  AUTH_REQUIRED: "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại",
  INSUFFICIENT_PERMISSION: "Bạn không có quyền thực hiện thao tác này",
  SEMESTER_NOT_FOUND: "Học kỳ không tồn tại",
  SEMESTER_REQUIRED: "Thiếu học kỳ — vui lòng chọn học kỳ trước khi thao tác",
  SEMESTER_INVALID: "Học kỳ không hợp lệ",
  RESOURCE_OUTSIDE_SEMESTER: "Dữ liệu này không thuộc học kỳ đang chọn",
  DATA_DUPLICATE: "Dữ liệu đã tồn tại — kiểm tra lại mã/thông tin trùng lặp",
  VALIDATION_ERROR: "Dữ liệu nhập chưa hợp lệ",
  STUDENT_NOT_FOUND: "Mã sinh viên không tồn tại",
  SUPERVISOR_NOT_FOUND: "Mã giảng viên không tồn tại",
  MEMBERSHIP_DUPLICATE: "Một sinh viên chỉ được ở một vị trí trong nhóm — kiểm tra lại mã trùng",
  PROJECT_DUPLICATE_OR_INVALID: "Mã đề tài đã tồn tại hoặc dữ liệu không hợp lệ",
  GROUP_INVALID: "Dữ liệu nhóm không hợp lệ — kiểm tra đề tài, sinh viên và đúng một Leader",
  ROUND_STATUS_INVALID: "Đợt đánh giá đang ở trạng thái không cho phép thao tác này",
  VERSION_DELETE_HAS_DEPENDENCIES: "Không xoá được — phương án lịch này đã có phiên/thay đổi hoặc đã công bố",
  ACTIVE_SEMESTER_EXISTS: "Đã có học kỳ đang hoạt động — chỉ được 1 học kỳ ACTIVE cùng lúc",
  SEMESTER_DURATION_INVALID: "Thời lượng học kỳ phải từ 105 đến 120 ngày",
  SEMESTER_DATE_INVALID: "Ngày bắt đầu/kết thúc không hợp lệ",
  SEMESTER_STATUS_INVALID: "Không chuyển được sang trạng thái này",
  ACADEMIC_YEAR_INVALID: "Năm học lọc không đúng định dạng YYYY-YYYY",

  // --- Mới, theo capstone-fe-be-implementation-spec.md §PHẦN XVI ---
  SEMESTER_NOT_ACTIVE: "Học kỳ chưa ở trạng thái Đang hoạt động",
  GROUP_CODE_DUPLICATE: "Mã nhóm đã tồn tại trong học kỳ này",
  STUDENT_NOT_ENROLLED: "Sinh viên chưa ghi danh học kỳ này",
  STUDENT_ALREADY_IN_GROUP: "Sinh viên đã ở trong một nhóm khác của học kỳ này",
  LEADER_NOT_ACTIVE_MEMBER: "Leader phải là thành viên đang hoạt động của nhóm",
  PROJECT_ALREADY_ASSIGNED: "Đề tài đã được gắn cho nhóm khác",
  PROJECT_HAS_NO_MAIN_SUPERVISOR: "Đề tài chưa có GVHD chính",
  ROUND_INVALID_STATE: "Đợt đánh giá đang ở trạng thái không cho phép thao tác này",
  ROUND_INVALID_TIMESLOT: "Timeslot không hợp lệ cho đợt đánh giá này",
  ROUND_ROOM_TYPE_REQUIRED: "Đợt đánh giá cần chọn ít nhất một loại phòng",
  INVITATION_NOT_PENDING: "Lời mời không còn ở trạng thái Đang chờ",
  INVITATION_NOT_ACCEPTED: "Giảng viên chưa nhận lời mời",
  GROUP_NOT_ELIGIBLE: "Nhóm chưa đủ điều kiện tham gia đợt này",
  USER_NOT_GROUP_LEADER: "Bạn không phải Leader của nhóm này",
  SCHEDULER_NOT_READY: "Chưa đủ điều kiện để chạy xếp lịch",
  ROOM_TYPE_NOT_ALLOWED: "Loại phòng này không được phép dùng cho đợt đánh giá",
  ROOM_NOT_ACTIVE: "Phòng hiện không hoạt động",
  ROOM_CONFLICT: "Phòng đã được dùng cho một phiên khác cùng khung giờ",
  SESSION_INVALID_STATE: "Phiên đánh giá đang ở trạng thái không cho phép thao tác này",
  REVIEWER_NOT_AVAILABLE: "Giảng viên không có lịch rảnh vào khung giờ này",
  REVIEWER_IS_SUPERVISOR: "Không thể chọn GVHD làm reviewer cho chính đề tài đó",
  REVIEWER_COI: "Giảng viên có xung đột lợi ích với đề tài này",
  REVIEWER_TIME_CONFLICT: "Giảng viên đã có phiên khác cùng khung giờ",
  REVIEWER_QUOTA_EXCEEDED: "Giảng viên đã vượt hạn mức trong học kỳ",
  RESULT_PERMISSION_DENIED: "Bạn không có quyền nhập kết quả cho phiên này",
  RESULT_TYPE_INVALID: "Loại kết quả không khớp với loại đợt đánh giá",
  REMEDIATION_REQUIRED_FIELDS_MISSING: "Thiếu hạn khắc phục hoặc người xác minh cho mức LEVEL_2",
  REGISTRATION_PHASE_INVALID: "Hiện chưa đến hoặc đã hết giai đoạn đăng ký dành cho bạn",
  GROUP_SELECTION_DISABLED: "Đợt đánh giá này không mở đăng ký nguyện vọng cho nhóm",
  AUTH_RESOURCE_SCOPE: "Bạn không có quyền truy cập dữ liệu này",
  GROUP_NOT_IN_ROUND: "Nhóm không thuộc đợt đánh giá này",
  REVIEWER_OVERLAP:
    "Không kích hoạt được — trùng lịch giảng viên với phương án đang dùng/đã công bố của round khác",
  /** Dùng chung cho 4 kiểu vi phạm khoảng ngày round: xem chi tiết trong `detail.message`/`error.message` gốc nếu cần. */
  TIMESLOT_OUT_OF_RANGE:
    "Ngày hoặc hạn đăng ký phải nằm trong khoảng bắt đầu–kết thúc của đợt, và hạn nhóm phải sau hạn giảng viên",
};

/**
 * Thông báo lỗi thân thiện: ưu tiên map theo `code` (đọc cả 2 shape lỗi), sau đó
 * `message` gốc từ backend, cuối cùng mới tới `fallback` của caller.
 */
export function friendlyErrorMessage(error: ApiError, fallback?: string): string {
  const code = detailCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) return ERROR_CODE_MESSAGES[code];
  return detailMessage(error) || error.message || fallback || "Có lỗi xảy ra";
}
