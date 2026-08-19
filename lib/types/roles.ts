// 4 role hệ thống — Capstone Defense Scheduler (PRD mục 3.1)
export const ROLE_ADMIN = "ADMIN";
export const ROLE_MANAGER = "MANAGER";
export const ROLE_LECTURER = "LECTURER";
export const ROLE_STUDENT = "STUDENT";

export type UserRole =
  | typeof ROLE_ADMIN
  | typeof ROLE_MANAGER
  | typeof ROLE_LECTURER
  | typeof ROLE_STUDENT;

export const ROLE_HOME: Record<string, string> = {
  [ROLE_ADMIN]: "/admin/dashboard",
  [ROLE_MANAGER]: "/manager/dashboard",
  [ROLE_LECTURER]: "/lecturer/dashboard",
  [ROLE_STUDENT]: "/student/dashboard",
};

// Vai trò theo ngữ cảnh (PRD mục 3.2) — suy ra từ dữ liệu, không gán cứng trên tài khoản
export const CONTEXT_ROLE_SUPERVISOR = "SUPERVISOR"; // GVHD
export const CONTEXT_ROLE_REVIEWER = "REVIEWER";
export const CONTEXT_ROLE_RESULT_OWNER = "RESULT_OWNER";
export const CONTEXT_ROLE_REMEDIATION_VERIFIER = "REMEDIATION_VERIFIER";
export const CONTEXT_ROLE_PROJECT_LEADER = "PROJECT_LEADER";
