import type { RoundStatus, RoundType } from "@/lib/api/services/fetchRounds";
import type { StatusTone } from "./status-dot";

export type { RoundStatus };

export const ROUND_STATUS_META: Record<RoundStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  OPEN_REGISTRATION: { label: "Đang mở đăng ký", tone: "sky" },
  REGISTRATION_CLOSED: { label: "Đã đóng đăng ký", tone: "amber" },
  SCHEDULING: { label: "Đang xếp lịch", tone: "amber" },
  SCHEDULED: { label: "Đã xếp lịch", tone: "violet" },
  PUBLISHED: { label: "Đã công bố", tone: "emerald" },
  ONGOING: { label: "Đang diễn ra", tone: "sky" },
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
  LOCKED: { label: "Đã khóa", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  REVIEW_1_1: "Review 1.1",
  REVIEW_2_1: "Review 2.1",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
  REVIEW_3: "Defense 1.1 (legacy)",
  DEFENSE_1: "Defense 1.2 (legacy)",
};

/** capstone-fe-be-implementation-spec.md §2 — vòng đời tổ chức của Group (khác ProjectStatus) */
export type GroupStatus = "FORMING" | "FORMED" | "ASSIGNED" | "DISBANDED";

export const GROUP_STATUS_META: Record<GroupStatus, { label: string; tone: StatusTone }> = {
  FORMING: { label: "Đang lập nhóm", tone: "neutral" },
  FORMED: { label: "Đã lập nhóm", tone: "sky" },
  ASSIGNED: { label: "Đã gắn đề tài", tone: "emerald" },
  DISBANDED: { label: "Đã giải tán", tone: "red" },
};

/** capstone-fe-be-implementation-spec.md §3 — academic progression của Project, BE tự transition */
export type ProjectProgressState =
  | "DRAFT"
  | "ACTIVE"
  | "ELIGIBLE_D12"
  | "D12_CONDITIONAL"
  | "PENDING_D2"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export const PROJECT_STATUS_META: Record<ProjectProgressState, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  ACTIVE: { label: "Đang đánh giá", tone: "sky" },
  ELIGIBLE_D12: { label: "Đủ điều kiện D1.2", tone: "emerald" },
  D12_CONDITIONAL: { label: "D1.2 có điều kiện", tone: "amber" },
  PENDING_D2: { label: "Chờ Defense 2", tone: "orange" },
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
  FAILED: { label: "Không đạt", tone: "red" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};

export type DefenseConclusion = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";

export const DEFENSE_CONCLUSION_META: Record<DefenseConclusion, { label: string; tone: StatusTone }> = {
  LEVEL_1: { label: "Mức 1", tone: "emerald" },
  LEVEL_2: { label: "Mức 2", tone: "amber" },
  LEVEL_3: { label: "Mức 3", tone: "orange" },
  LEVEL_4: { label: "Mức 4", tone: "red" },
};

export const DEFENSE_1_RESULT_META = {
  COMPLETED: { label: "Hoàn thành", tone: "emerald" as const },
};

export const DEFENSE_2_RESULT_META = {
  PASS: { label: "Đạt", tone: "emerald" as const },
  FAIL: { label: "Không đạt", tone: "red" as const },
};

export function getRoundResultMeta(roundType: RoundType, result: string) {
  if (roundType === "REVIEW_1" || roundType === "REVIEW_2" || roundType === "REVIEW_1_1" || roundType === "REVIEW_2_1") {
    return REVIEW_RESULT_META[result as ReviewResult];
  }
  if (roundType === "REVIEW_3" || roundType === "DEFENSE_1_1") {
    return DEFENSE_CONCLUSION_META[result as DefenseConclusion];
  }
  if (roundType === "DEFENSE_1" || roundType === "DEFENSE_1_2") {
    return DEFENSE_1_RESULT_META[result as keyof typeof DEFENSE_1_RESULT_META];
  }
  return DEFENSE_2_RESULT_META[result as keyof typeof DEFENSE_2_RESULT_META];
}

export type RemediationStatus = "OPEN" | "OVERDUE" | "PASSED" | "FAILED";

export const REMEDIATION_STATUS_META: Record<RemediationStatus, { label: string; tone: StatusTone }> = {
  OPEN: { label: "Đang chờ", tone: "amber" },
  PASSED: { label: "Đạt", tone: "emerald" },
  OVERDUE: { label: "Quá hạn", tone: "red" },
  FAILED: { label: "Không đạt", tone: "red" },
};

/** capstone-fe-be-implementation-spec.md §5 — thêm EXPIRED/WITHDRAWN, REJECTED đổi tên thành DECLINED */
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";

export const INVITATION_STATUS_META: Record<InvitationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Đang chờ", tone: "amber" },
  ACCEPTED: { label: "Đã nhận lời", tone: "emerald" },
  DECLINED: { label: "Đã từ chối", tone: "red" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
  WITHDRAWN: { label: "Đã rút lời mời", tone: "neutral" },
};

export type ScheduleVersionStatus = "VALID" | "PUBLISHED" | "SUPERSEDED";

export const SCHEDULE_VERSION_STATUS_META: Record<ScheduleVersionStatus, { label: string; tone: StatusTone }> = {
  VALID: { label: "Hợp lệ", tone: "violet" },
  PUBLISHED: { label: "Đã công bố", tone: "emerald" },
  SUPERSEDED: { label: "Đã thay thế", tone: "neutral" },
};

/** capstone-fe-be-implementation-spec.md §6 — DRAFT → ACTIVE → PUBLISHED, hoặc DISCARDED */
export type RoundScheduleVersionStatus = "DRAFT" | "ACTIVE" | "PUBLISHED" | "DISCARDED";

export const ROUND_SCHEDULE_VERSION_STATUS_META: Record<RoundScheduleVersionStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  ACTIVE: { label: "Đang dùng", tone: "violet" },
  PUBLISHED: { label: "Đã công bố", tone: "emerald" },
  DISCARDED: { label: "Đã loại bỏ", tone: "red" },
};

export type ReviewResult = "PASS" | "NEEDS_FIX" | "FAIL";

export const REVIEW_RESULT_META: Record<ReviewResult, { label: string; tone: StatusTone }> = {
  PASS: { label: "Đạt", tone: "emerald" },
  NEEDS_FIX: { label: "Cần sửa", tone: "amber" },
  FAIL: { label: "Không đạt", tone: "red" },
};

export type ChangeRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED";

export const CHANGE_REQUEST_STATUS_META: Record<ChangeRequestStatus, { label: string; tone: StatusTone }> = {
  REQUESTED: { label: "Đang chờ", tone: "amber" },
  APPROVED: { label: "Đã duyệt", tone: "sky" },
  REJECTED: { label: "Đã từ chối", tone: "red" },
};

export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "POSTPONED";

export const SESSION_STATUS_META: Record<SessionStatus, { label: string; tone: StatusTone }> = {
  SCHEDULED: { label: "Đã xếp lịch", tone: "violet" },
  ONGOING: { label: "Đang diễn ra", tone: "sky" },
  COMPLETED: { label: "Đã diễn ra", tone: "neutral" },
  POSTPONED: { label: "Đã hoãn", tone: "red" },
};

/** capstone-fe-be-implementation-spec.md §7 — thêm PLANNED/GROUP_ABSENT/CANCELLED so với enum cũ */
export type RoundSessionStatus = "PLANNED" | "SCHEDULED" | "COMPLETED" | "POSTPONED" | "GROUP_ABSENT" | "CANCELLED";

export const ROUND_SESSION_STATUS_META: Record<RoundSessionStatus, { label: string; tone: StatusTone }> = {
  PLANNED: { label: "Đã lên kế hoạch", tone: "neutral" },
  SCHEDULED: { label: "Đã xếp lịch", tone: "violet" },
  COMPLETED: { label: "Đã diễn ra", tone: "emerald" },
  POSTPONED: { label: "Đã hoãn", tone: "amber" },
  GROUP_ABSENT: { label: "Nhóm vắng", tone: "red" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};

export type AttentionSeverity = "HIGH" | "MEDIUM" | "LOW";

export const SEVERITY_META: Record<AttentionSeverity, { label: string; tone: StatusTone }> = {
  HIGH: { label: "Cao", tone: "red" },
  MEDIUM: { label: "Trung bình", tone: "amber" },
  LOW: { label: "Thấp", tone: "neutral" },
};
