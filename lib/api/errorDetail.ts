import type { ApiError } from "@/types/api";

interface ErrorDetail {
  detail?: { code?: string; message?: string; violations?: unknown[] };
}

export function detailCode(error: ApiError): string | undefined {
  return (error.data as ErrorDetail | undefined)?.detail?.code;
}

export function detailMessage(error: ApiError): string | undefined {
  return (error.data as ErrorDetail | undefined)?.detail?.message;
}

export function detailViolations(error: ApiError): unknown[] | undefined {
  return (error.data as ErrorDetail | undefined)?.detail?.violations;
}

/**
 * Map `detail.code` → thông báo tiếng Việt dễ hiểu cho người dùng cuối.
 * Chỉ phủ các mã đã thấy thực tế từ backend hoặc tài liệu trong docs/*.md — mã lạ sẽ
 * rơi xuống `detail.message`/`error.message` gốc, không hiện code kỹ thuật cho manager.
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
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
};

/**
 * Thông báo lỗi thân thiện: ưu tiên map theo `detail.code`, sau đó `detail.message` gốc,
 * rồi `error.message`, cuối cùng mới tới `fallback` của caller.
 */
export function friendlyErrorMessage(error: ApiError, fallback?: string): string {
  const code = detailCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) return ERROR_CODE_MESSAGES[code];
  return detailMessage(error) || error.message || fallback || "Có lỗi xảy ra";
}
