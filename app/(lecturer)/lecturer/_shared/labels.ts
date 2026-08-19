import type { RoundInvitationStatus, RoundType } from "@/lib/api/services/fetchRounds";
import type { ReviewResult, DefenseResult } from "@/lib/api/services/fetchResults";
import type { ProjectStatus } from "@/lib/api/services/fetchProjects";
import type { RemediationStatus } from "@/lib/api/services/fetchLecturerPortal";
import type { StatusTone } from "./status-dot";

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
};

/** capstone-fe-be-implementation-spec.md §5 */
export const INVITATION_STATUS_META: Record<RoundInvitationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Đang chờ phản hồi", tone: "amber" },
  ACCEPTED: { label: "Đã nhận lời", tone: "emerald" },
  DECLINED: { label: "Đã từ chối", tone: "red" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
  WITHDRAWN: { label: "Đã bị rút lời mời", tone: "neutral" },
};

export const PREFERRED_LOAD_LABEL = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao" } as const;

/** spec §9/§74 — Review 1/2 result */
export const REVIEW_RESULT_META: Record<ReviewResult, { label: string; tone: StatusTone }> = {
  PASS: { label: "Đạt", tone: "emerald" },
  NEEDS_FIX: { label: "Cần sửa", tone: "amber" },
  FAIL: { label: "Không đạt", tone: "red" },
};

/** spec §9/§74 — Defense result. LEVEL_2 bắt buộc remediation */
export const DEFENSE_RESULT_META: Record<DefenseResult, { label: string; tone: StatusTone }> = {
  LEVEL_1: { label: "Mức 1", tone: "emerald" },
  LEVEL_2: { label: "Mức 2 — cần khắc phục", tone: "amber" },
  LEVEL_3: { label: "Mức 3", tone: "orange" },
  LEVEL_4: { label: "Mức 4 — Không đạt", tone: "red" },
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

/** spec §34 — suy luận, chưa có trong spec (xem ghi chú trong fetchLecturerPortal.ts) */
export const REMEDIATION_STATUS_META: Record<RemediationStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Chờ xác nhận", tone: "amber" },
  PASSED: { label: "Đạt", tone: "emerald" },
  OVERDUE: { label: "Quá hạn", tone: "red" },
  FAILED: { label: "Không đạt", tone: "red" },
};
