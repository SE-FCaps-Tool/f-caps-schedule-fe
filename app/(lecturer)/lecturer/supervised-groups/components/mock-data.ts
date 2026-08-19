import type { RoundType } from "@/types/models";

// TODO: thay bằng dữ liệu thật từ API khi backend sẵn sàng (FR-8.3).
// Shape cố ý bám theo types/models.ts (Group, Round, GroupMember...) để việc
// nối API sau này chỉ là đổi nguồn dữ liệu, không đổi component.

export type ResultTone = "neutral" | "emerald" | "amber" | "orange" | "red" | "sky";

export type GroupJourneyStatus =
  | "ACTIVE"
  | "ELIGIBLE_D12"
  | "D12_CONDITIONAL"
  | "PENDING_D2"
  | "FAILED"
  | "COMPLETED";

export type ReviewOutcome = "Đạt" | "Cần sửa" | "Không đạt";

export interface DefenseLevelMeta {
  level: 1 | 2 | 3 | 4;
  label: string;
  tone: ResultTone;
}

export const DEFENSE_LEVELS: Record<1 | 2 | 3 | 4, DefenseLevelMeta> = {
  1: { level: 1, label: "Mức 1", tone: "emerald" },
  2: { level: 2, label: "Mức 2", tone: "amber" },
  3: { level: 3, label: "Mức 3", tone: "orange" },
  4: { level: 4, label: "Mức 4", tone: "red" },
};

export const JOURNEY_STATUS_META: Record<GroupJourneyStatus, { label: string; tone: ResultTone }> = {
  ACTIVE: { label: "Đang đánh giá", tone: "sky" },
  ELIGIBLE_D12: { label: "Chờ Defense 1.2", tone: "emerald" },
  D12_CONDITIONAL: { label: "D1.2 có điều kiện", tone: "amber" },
  PENDING_D2: { label: "Chờ Defense 2", tone: "orange" },
  FAILED: { label: "Không đạt", tone: "red" },
  COMPLETED: { label: "Hoàn thành", tone: "emerald" },
};

export interface RoundResult {
  id: string;
  roundType: RoundType;
  label: string;
  kind: "review" | "defense";
  phaseStatus: "completed" | "upcoming" | "locked";
  date?: string;
  reviewOutcome?: ReviewOutcome;
  defenseLevel?: 1 | 2 | 3 | 4;
}

export interface GroupMemberInfo {
  id: string;
  fullName: string;
  studentCode: string;
  isLeader: boolean;
}

export interface RemediationInfo {
  dueDate: string;
  verifier: { name: string; code: string };
  status: "pending" | "passed" | "overdue";
}

export interface SupervisedGroup {
  id: string;
  code: string;
  titleVi: string;
  titleEn: string;
  myRole: "MAIN" | "CO";
  currentStatus: GroupJourneyStatus;
  members: GroupMemberInfo[];
  maxMembers: number;
  rounds: RoundResult[];
  remediation?: RemediationInfo;
}

export const supervisedGroups: SupervisedGroup[] = [
  {
    id: "g1",
    code: "SU26SE009-G2",
    titleVi: "Nền tảng quản lý kho thông minh cho hộ kinh doanh nhỏ",
    titleEn: "Smart Inventory Platform for Small Retailers",
    myRole: "MAIN",
    currentStatus: "ACTIVE",
    maxMembers: 5,
    members: [
      { id: "m1", fullName: "Mai Quốc Anh", studentCode: "AnhMQ3", isLeader: true },
      { id: "m2", fullName: "Đỗ Ngọc Diễm", studentCode: "DiemDN4", isLeader: false },
      { id: "m3", fullName: "Hoàng Gia Bảo", studentCode: "BaoHG1", isLeader: false },
      { id: "m4", fullName: "Trịnh Bảo Long", studentCode: "LongTB2", isLeader: false },
    ],
    rounds: [
      { id: "r1", roundType: "REVIEW_1", label: "Review 1", kind: "review", phaseStatus: "completed", date: "2026-07-08", reviewOutcome: "Đạt" },
      { id: "r2", roundType: "REVIEW_2", label: "Review 2", kind: "review", phaseStatus: "completed", date: "2026-07-29", reviewOutcome: "Cần sửa" },
      { id: "r3", roundType: "DEFENSE_1_1", label: "Defense 1.1", kind: "defense", phaseStatus: "upcoming", date: "2026-08-27" },
      { id: "r4", roundType: "DEFENSE_1_2", label: "Đợt tiếp theo", kind: "defense", phaseStatus: "locked" },
    ],
  },
  {
    id: "g2",
    code: "SU26SE014-G6",
    titleVi: "Ứng dụng theo dõi sức khoẻ tâm lý sinh viên",
    titleEn: "Student Mental Wellbeing Tracker",
    myRole: "CO",
    currentStatus: "ELIGIBLE_D12",
    maxMembers: 4,
    members: [
      { id: "m5", fullName: "Phan Đức Hiển", studentCode: "HienPD1", isLeader: true },
      { id: "m6", fullName: "Nguyễn Thảo My", studentCode: "MyNT2", isLeader: false },
      { id: "m7", fullName: "Đặng Văn Khoa", studentCode: "KhoaDV3", isLeader: false },
    ],
    rounds: [
      { id: "r5", roundType: "REVIEW_1", label: "Review 1", kind: "review", phaseStatus: "completed", date: "2026-07-08", reviewOutcome: "Đạt" },
      { id: "r6", roundType: "REVIEW_2", label: "Review 2", kind: "review", phaseStatus: "completed", date: "2026-07-29", reviewOutcome: "Đạt" },
      { id: "r7", roundType: "DEFENSE_1_1", label: "Defense 1.1", kind: "defense", phaseStatus: "completed", date: "2026-08-13", defenseLevel: 1 },
      { id: "r8", roundType: "DEFENSE_1_2", label: "Defense 1.2", kind: "defense", phaseStatus: "upcoming", date: "2026-09-03" },
    ],
  },
  {
    id: "g3",
    code: "SU26SE021-G8",
    titleVi: "Nền tảng đặt lịch khám bệnh từ xa cho phòng khám tư",
    titleEn: "Telehealth Booking Platform for Private Clinics",
    myRole: "MAIN",
    currentStatus: "D12_CONDITIONAL",
    maxMembers: 5,
    members: [
      { id: "m8", fullName: "Vũ Thành Đạt", studentCode: "DatVT1", isLeader: true },
      { id: "m9", fullName: "Lê Minh Trang", studentCode: "TrangLM2", isLeader: false },
      { id: "m10", fullName: "Bùi Anh Tuấn", studentCode: "TuanBA3", isLeader: false },
      { id: "m11", fullName: "Cao Thị Yến", studentCode: "YenCT4", isLeader: false },
    ],
    rounds: [
      { id: "r9", roundType: "REVIEW_1", label: "Review 1", kind: "review", phaseStatus: "completed", date: "2026-07-08", reviewOutcome: "Đạt" },
      { id: "r10", roundType: "REVIEW_2", label: "Review 2", kind: "review", phaseStatus: "completed", date: "2026-07-29", reviewOutcome: "Đạt" },
      { id: "r11", roundType: "DEFENSE_1_1", label: "Defense 1.1", kind: "defense", phaseStatus: "completed", date: "2026-08-18", defenseLevel: 2 },
      { id: "r12", roundType: "DEFENSE_1_2", label: "Defense 1.2 (có điều kiện)", kind: "defense", phaseStatus: "upcoming", date: "2026-09-03" },
    ],
    remediation: {
      dueDate: "2026-08-21",
      verifier: { name: "Nguyễn Thảo My", code: "MyNT2" },
      status: "pending",
    },
  },
  {
    id: "g4",
    code: "SU26SE028-G11",
    titleVi: "Ứng dụng quản lý chi tiêu nhóm cho sinh viên ở trọ",
    titleEn: "Shared Expense Manager for Student Housing",
    myRole: "MAIN",
    currentStatus: "ACTIVE",
    maxMembers: 5,
    members: [
      { id: "m12", fullName: "Ngô Bảo Châu", studentCode: "ChauNB1", isLeader: false },
      { id: "m13", fullName: "Phạm Thu Hà", studentCode: "HaPT2", isLeader: false },
      { id: "m14", fullName: "Đỗ Minh Quân", studentCode: "QuanDM3", isLeader: false },
    ],
    rounds: [
      { id: "r13", roundType: "REVIEW_1", label: "Review 1", kind: "review", phaseStatus: "upcoming", date: "2026-08-25" },
      { id: "r14", roundType: "REVIEW_2", label: "Review 2", kind: "review", phaseStatus: "locked" },
      { id: "r15", roundType: "DEFENSE_1_1", label: "Defense 1.1", kind: "defense", phaseStatus: "locked" },
    ],
  },
];
