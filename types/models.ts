import type { UserRole } from "@/lib/types/roles";

// ===== Định danh & tài khoản =====
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole; // Role hệ thống là cố định (PRD 3.2), không phải mảng
  avatarUrl?: string;
}

export interface DecodedToken extends User {
  nbf?: number;
  exp?: number;
  iat?: number;
}

export interface Major {
  id: string;
  code: string; // VD: SE
  name: string;
}

export interface Lecturer {
  id: string;
  lecturerCode: string; // VD: TaiNT51 — khoá dùng trong mọi liên kết lịch
  fullName: string;
  email: string;
  majorId: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  majorId: string;
}

export interface Room {
  id: string;
  code: string;
  campus: string;
  capacity: number;
  isOnline: boolean;
}

export interface Semester {
  id: string;
  code: string; // VD: SU26
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface LecturerSemesterQuota {
  id: string;
  lecturerId: string;
  semesterId: string;
  maxSessions: number;
}

// ===== Đề tài — Nhóm — Sinh viên =====
export type SupervisorRole = "MAIN" | "CO";

export interface ProjectSupervisor {
  lecturerId: string;
  role: SupervisorRole;
}

export type GroupStatus =
  | "ACTIVE"
  | "ELIGIBLE_D12"
  | "D12_CONDITIONAL"
  | "PENDING_D2"
  | "COMPLETED"
  | "FAILED";

export interface Project {
  id: string;
  projectCode: string; // [Kỳ][Ngành][STT], VD SU26SE017
  titleVi: string;
  titleEn: string;
  semesterId: string;
  majorId: string;
  previousProjectId?: string | null; // retake kỳ sau
  supervisors: ProjectSupervisor[];
}

export type GroupMemberRole = "LEADER" | "MEMBER";
export type GroupMemberStatus = "ACTIVE" | "DROPPED";

export interface GroupMember {
  id: string;
  studentId: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
  leftAt?: string | null;
}

export interface Group {
  id: string;
  groupCode: string;
  projectId: string;
  status: GroupStatus;
  members: GroupMember[];
}

export interface ConflictDeclaration {
  id: string;
  lecturerId: string;
  projectId: string;
  reason: string;
}

// ===== Đợt — Ngày — Khung giờ =====
export type RoundType =
  | "REVIEW_1"
  | "REVIEW_2"
  | "REVIEW_3"
  | "DEFENSE_1"
  | "DEFENSE_2";

export type RoundStatus =
  | "DRAFT"
  | "OPEN_REGISTRATION"
  | "REGISTRATION_CLOSED"
  | "SCHEDULING"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "LOCKED";

export interface Round {
  id: string;
  name: string;
  type: RoundType;
  semesterId: string;
  majorId: string;
  status: RoundStatus;
  sessionDurationMinutes: number; // 45 / 60 / 90
  councilSize: number; // 2 / 3 / 5
  maxGroupsPerTimeslot: number; // H13
  maxMinutesPerPart: number; // H12 — 240
  maxMinutesPerDay: number; // H12 — 480
  registrationDeadline: string;
  groupSelectionMode: boolean;
  resultOwnerMode: boolean;
  councilReuseMode: boolean;
}

export interface RoundDay {
  id: string;
  roundId: string;
  dayDate: string;
  morningStart?: string;
  morningEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
}

export interface Timeslot {
  id: string;
  roundId: string;
  roundDayId: string;
  startTime: string;
  endTime: string;
}

// ===== Mời & Đăng ký =====
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type LoadLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RoundInvitation {
  id: string;
  roundId: string;
  lecturerId: string;
  status: InvitationStatus;
  preferredLoadLevel?: LoadLevel;
  declineReason?: string;
}

export interface LecturerAvailability {
  id: string;
  roundId: string;
  lecturerId: string;
  timeslotId: string;
  source: "SELF" | "MANAGER";
}

export interface GroupSlotPreference {
  id: string;
  roundId: string;
  groupId: string;
  timeslotId: string;
}

// ===== Hội đồng & Lịch =====
export interface Council {
  id: string;
  roundId: string;
  code: string;
  derivedFromCouncilId?: string | null;
  changeReason?: string;
  memberLecturerIds: string[];
}

export interface ScheduleVersion {
  id: string;
  roundId: string;
  isActive: boolean;
  softScores: Record<string, number>;
  createdAt: string;
}

export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "POSTPONED";

export interface Session {
  id: string;
  scheduleVersionId: string;
  roundId: string;
  timeslotId: string;
  roomId: string;
  groupId: string;
  councilId: string;
  status: SessionStatus;
}

export interface UnscheduledGroup {
  id: string;
  scheduleVersionId: string;
  groupId: string;
  reasonCode: string;
  reasonDetail: string;
}

// ===== Kết quả =====
export type ReviewOutcome = "PASS" | "MINOR_REVISION" | "FAIL";
export type DefenseOutcome = "DEFENSE_L1" | "DEFENSE_L2" | "DEFENSE_L3" | "DEFENSE_L4";
export type VerifyStatus = "NOT_APPLICABLE" | "PENDING" | "VERIFIED" | "OVERDUE_FAILED";

export interface SessionResult {
  id: string;
  sessionId: string;
  outcome: ReviewOutcome | DefenseOutcome;
  note?: string;
  enteredByLecturerId: string;
  remediationDueAt?: string | null;
  verifierLecturerId?: string | null;
  verifyStatus?: VerifyStatus;
  overdueClosedAt?: string | null;
}

export interface RescheduleRequest {
  id: string;
  sessionId: string;
  requestedByUserId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}
