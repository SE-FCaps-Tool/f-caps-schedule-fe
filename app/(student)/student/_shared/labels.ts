import type { RoundType, RoundStatus } from "@/lib/api/services/fetchRounds";
import type { ProjectStatus } from "@/lib/api/services/fetchProjects";
import type { RoundResult, Review3Result, Defense1Result, Defense2Result, ReviewResult } from "@/lib/api/services/fetchResults";
import type { RemediationStatus } from "@/lib/api/services/fetchLecturerPortal";
import type { PreferenceStatus, LeaderSessionStatus } from "@/lib/api/services/fetchLeaderPortal";
import type { StatusTone } from "./status-dot";

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

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  DRAFT: "Nháp",
  OPEN_REGISTRATION: "Đang mở đăng ký",
  REGISTRATION_CLOSED: "Đã đóng đăng ký",
  SCHEDULING: "Đang xếp lịch",
  SCHEDULED: "Đã xếp lịch",
  PUBLISHED: "Đã công bố",
  ONGOING: "Đang diễn ra",
  COMPLETED: "Đã hoàn tất",
  LOCKED: "Đã khoá",
  CANCELLED: "Đã huỷ",
};

/** spec §3 ProjectStatus */
export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  ACTIVE: { label: "Đang đánh giá", tone: "sky" },
  ELIGIBLE_D12: { label: "Đủ điều kiện D1.2", tone: "emerald" },
  D12_CONDITIONAL: { label: "D1.2 có điều kiện", tone: "amber" },
  PENDING_D2: { label: "Chờ Defense 2", tone: "orange" },
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
  FAILED: { label: "Không đạt", tone: "red" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};

export const REVIEW_RESULT_META: Record<ReviewResult, { label: string; tone: StatusTone }> = {
  PASS: { label: "Đạt", tone: "emerald" },
  NEEDS_FIX: { label: "Cần sửa", tone: "amber" },
  FAIL: { label: "Không đạt", tone: "red" },
};

export const DEFENSE_RESULT_META: Record<Review3Result, { label: string; tone: StatusTone }> = {
  LEVEL_1: { label: "Mức 1", tone: "emerald" },
  LEVEL_2: { label: "Mức 2 — cần khắc phục", tone: "amber" },
  LEVEL_3: { label: "Mức 3", tone: "orange" },
  LEVEL_4: { label: "Mức 4 — Không đạt", tone: "red" },
};

export const DEFENSE_1_RESULT_META: Record<Defense1Result, { label: string; tone: StatusTone }> = {
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
};

export const DEFENSE_2_RESULT_META: Record<Defense2Result, { label: string; tone: StatusTone }> = {
  PASS: { label: "Đạt", tone: "emerald" },
  FAIL: { label: "Không đạt", tone: "red" },
};

export function getRoundResultMeta(roundType: RoundType, result: RoundResult) {
  if (roundType === "REVIEW_1" || roundType === "REVIEW_2" || roundType === "REVIEW_1_1" || roundType === "REVIEW_2_1") {
    return REVIEW_RESULT_META[result as ReviewResult];
  }
  if (roundType === "REVIEW_3" || roundType === "DEFENSE_1_1") {
    return DEFENSE_RESULT_META[result as Review3Result];
  }
  if (roundType === "DEFENSE_1" || roundType === "DEFENSE_1_2") {
    return DEFENSE_1_RESULT_META[result as Defense1Result];
  }
  return DEFENSE_2_RESULT_META[result as Defense2Result];
}

export const REMEDIATION_STATUS_META: Record<RemediationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Chờ xác nhận", tone: "amber" },
  PASSED: { label: "Đạt", tone: "emerald" },
  OVERDUE: { label: "Quá hạn", tone: "red" },
  FAILED: { label: "Không đạt", tone: "red" },
};

/** spec §38 — không có mô tả chi tiết enum, suy luận 3 trạng thái đơn giản */
export const PREFERENCE_STATUS_LABEL: Record<PreferenceStatus, string> = {
  NOT_REQUIRED: "Không cần chọn",
  PENDING: "Chưa chọn",
  SUBMITTED: "Đã chọn",
};

export const SESSION_STATUS_META: Record<LeaderSessionStatus, { label: string; tone: StatusTone }> = {
  SCHEDULED: { label: "Sắp diễn ra", tone: "neutral" },
  COMPLETED: { label: "Đã xong", tone: "emerald" },
  POSTPONED: { label: "Đã hoãn", tone: "amber" },
  GROUP_ABSENT: { label: "Nhóm vắng mặt", tone: "red" },
  CANCELLED: { label: "Đã huỷ", tone: "red" },
};
