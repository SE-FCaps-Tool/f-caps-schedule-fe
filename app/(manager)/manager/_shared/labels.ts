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
  POSTPONED: { label: "Đã hoãn", tone: "orange" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
};

export type GroupProgressState =
  | "ACTIVE"
  | "D12_CONDITIONAL"
  | "ELIGIBLE_D12"
  | "PENDING_D2"
  | "COMPLETED"
  | "FAILED";

export const GROUP_PROGRESS_META: Record<GroupProgressState, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Đang đánh giá", tone: "sky" },
  D12_CONDITIONAL: { label: "D1.2 có điều kiện", tone: "amber" },
  ELIGIBLE_D12: { label: "Đủ điều kiện D1.2", tone: "emerald" },
  PENDING_D2: { label: "Chờ Defense 2", tone: "orange" },
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
  FAILED: { label: "Không đạt", tone: "red" },
};

export type DefenseConclusion = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";

export const DEFENSE_CONCLUSION_META: Record<DefenseConclusion, { label: string; tone: StatusTone }> = {
  LEVEL_1: { label: "Mức 1", tone: "emerald" },
  LEVEL_2: { label: "Mức 2", tone: "amber" },
  LEVEL_3: { label: "Mức 3", tone: "orange" },
  LEVEL_4: { label: "Mức 4", tone: "red" },
};

export type RemediationStatus = "OPEN" | "OVERDUE" | "PASSED" | "FAILED";

export const REMEDIATION_STATUS_META: Record<RemediationStatus, { label: string; tone: StatusTone }> = {
  OPEN: { label: "Đang chờ", tone: "amber" },
  PASSED: { label: "Đạt", tone: "emerald" },
  OVERDUE: { label: "Quá hạn", tone: "red" },
  FAILED: { label: "Không đạt", tone: "red" },
};

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export const INVITATION_STATUS_META: Record<InvitationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Đang chờ", tone: "amber" },
  ACCEPTED: { label: "Đã nhận lời", tone: "emerald" },
  REJECTED: { label: "Đã từ chối", tone: "red" },
};

export type ScheduleVersionStatus = "VALID" | "PUBLISHED" | "SUPERSEDED";

export const SCHEDULE_VERSION_STATUS_META: Record<ScheduleVersionStatus, { label: string; tone: StatusTone }> = {
  VALID: { label: "Hợp lệ", tone: "violet" },
  PUBLISHED: { label: "Đã công bố", tone: "emerald" },
  SUPERSEDED: { label: "Đã thay thế", tone: "neutral" },
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

export type AttentionSeverity = "HIGH" | "MEDIUM" | "LOW";

export const SEVERITY_META: Record<AttentionSeverity, { label: string; tone: StatusTone }> = {
  HIGH: { label: "Cao", tone: "red" },
  MEDIUM: { label: "Trung bình", tone: "amber" },
  LOW: { label: "Thấp", tone: "neutral" },
};
