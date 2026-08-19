import type { RoundType } from "@/types/models";

// TODO: thay bằng dữ liệu thật từ API khi backend sẵn sàng (FR-7.1 → 7.6).
// Shape cố ý bám theo types/models.ts (Session, SessionResult...) để việc
// nối API sau này chỉ là đổi nguồn dữ liệu, không đổi component.

export type ResultTone = "neutral" | "emerald" | "amber" | "orange" | "red" | "sky";

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
};

export type ReviewOutcome = "Đạt" | "Cần sửa" | "Không đạt";

export const REVIEW_OUTCOMES: { value: ReviewOutcome; tone: ResultTone }[] = [
  { value: "Đạt", tone: "emerald" },
  { value: "Cần sửa", tone: "amber" },
  { value: "Không đạt", tone: "red" },
];

export interface DefenseLevelMeta {
  level: 1 | 2 | 3 | 4;
  label: string;
  meaning: string;
  tone: ResultTone;
}

export const DEFENSE_LEVELS: DefenseLevelMeta[] = [
  { level: 1, label: "Mức 1", meaning: "Đủ điều kiện, không vướng gì. Xếp Defense 1.2 ngay.", tone: "emerald" },
  { level: 2, label: "Mức 2", meaning: "Đạt nhưng còn thiếu — cần khắc phục trước hạn.", tone: "amber" },
  { level: 3, label: "Mức 3", meaning: "Chưa đủ điều kiện đợt này. Chuyển sang Defense 2.", tone: "orange" },
  { level: 4, label: "Mức 4", meaning: "Không đạt. Làm lại đồ án ở kỳ sau.", tone: "red" },
];

export interface CouncilMember {
  id: string;
  name: string;
  code: string;
}

export interface PendingResultSession {
  id: string;
  roundType: RoundType;
  kind: "review" | "defense";
  groupCode: string;
  groupTitleVi: string;
  date: string;
  room: string;
  isOnline: boolean;
  councilMembers: CouncilMember[];
  myRole: "Reviewer" | "Result Owner";
}

export const pendingResultSessions: PendingResultSession[] = [
  {
    id: "pr-1",
    roundType: "REVIEW_1",
    kind: "review",
    groupCode: "SU26SE009-G2",
    groupTitleVi: "Nền tảng quản lý kho thông minh cho hộ kinh doanh nhỏ",
    date: "2026-08-13",
    room: "A203",
    isOnline: false,
    councilMembers: [
      { id: "c1", name: "Trịnh Bảo Long", code: "LongTB2" },
      { id: "c2", name: "Trần Thị Giảng Viên", code: "VienTT1" },
    ],
    myRole: "Reviewer",
  },
  {
    id: "pr-2",
    roundType: "DEFENSE_1_1",
    kind: "defense",
    groupCode: "SU26SE017-G4",
    groupTitleVi: "Hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp",
    date: "2026-08-18",
    room: "B105",
    isOnline: false,
    councilMembers: [
      { id: "c3", name: "Nguyễn Thảo My", code: "MyNT2" },
      { id: "c4", name: "Đặng Văn Khoa", code: "KhoaDV3" },
      { id: "c5", name: "Trần Thị Giảng Viên", code: "VienTT1" },
    ],
    myRole: "Result Owner",
  },
  {
    id: "pr-3",
    roundType: "DEFENSE_1_1",
    kind: "defense",
    groupCode: "SU26SE021-G8",
    groupTitleVi: "Nền tảng đặt lịch khám bệnh từ xa cho phòng khám tư",
    date: "2026-08-18",
    room: "B105",
    isOnline: false,
    councilMembers: [
      { id: "c6", name: "Vũ Thành Đạt", code: "DatVT1" },
      { id: "c7", name: "Lê Minh Trang", code: "TrangLM2" },
      { id: "c8", name: "Trần Thị Giảng Viên", code: "VienTT1" },
    ],
    myRole: "Reviewer",
  },
  {
    id: "pr-4",
    roundType: "REVIEW_2",
    kind: "review",
    groupCode: "SU26SE003-G1",
    groupTitleVi: "Hệ thống gợi ý lộ trình học cá nhân hoá bằng AI",
    date: "2026-08-16",
    room: "Online — Google Meet",
    isOnline: true,
    councilMembers: [{ id: "c9", name: "Phan Đức Hiển", code: "HienPD1" }],
    myRole: "Reviewer",
  },
];

export interface RemediationTask {
  id: string;
  groupCode: string;
  groupTitleVi: string;
  dueDate: string;
  status: "pending" | "passed" | "overdue";
}

export const remediationTasks: RemediationTask[] = [
  {
    id: "rt-1",
    groupCode: "SU26SE014-G6",
    groupTitleVi: "Ứng dụng theo dõi sức khoẻ tâm lý sinh viên",
    dueDate: "2026-08-21",
    status: "pending",
  },
];
