import type { RoundType } from "@/types/models";

// TODO: thay bằng dữ liệu thật từ API khi backend sẵn sàng (FR-8.2).
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
  meaning: string;
  nextStep: string;
  tone: ResultTone;
}

export const DEFENSE_LEVELS: Record<1 | 2 | 3 | 4, DefenseLevelMeta> = {
  1: {
    level: 1,
    label: "Mức 1 — Được bảo vệ lần 1",
    meaning: "Đủ điều kiện, không vướng gì.",
    nextStep: "Xếp Defense 1.2 ngay.",
    tone: "emerald",
  },
  2: {
    level: 2,
    label: "Mức 2 — Được bảo vệ lần 1 (có điều kiện)",
    meaning: "Sản phẩm đạt, hồ sơ hoặc trình bày còn thiếu.",
    nextStep: "Xếp Defense 1.2 có điều kiện — cần khắc phục các mục bắt buộc trước hạn.",
    tone: "amber",
  },
  3: {
    level: 3,
    label: "Mức 3 — Sửa lại để bảo vệ lần 2",
    meaning: "Chưa đủ điều kiện đợt này.",
    nextStep: "Chuyển sang Defense 2.",
    tone: "orange",
  },
  4: {
    level: 4,
    label: "Mức 4 — Không đạt",
    meaning: "Vi phạm nghiêm trọng hoặc chưa khắc phục kịp thời hạn.",
    nextStep: "Không có Defense 2 — làm lại đồ án ở kỳ sau.",
    tone: "red",
  },
};

export const JOURNEY_STATUS_META: Record<
  GroupJourneyStatus,
  { label: string; description: string; tone: ResultTone }
> = {
  ACTIVE: {
    label: "Đang trong quá trình đánh giá",
    description: "Nhóm đang ở các đợt Review hoặc chờ kết quả Defense 1.1.",
    tone: "sky",
  },
  ELIGIBLE_D12: {
    label: "Đủ điều kiện — chờ Defense 1.2",
    description: "Defense 1.1 đạt Mức 1, nhóm được xếp Defense 1.2 không điều kiện.",
    tone: "emerald",
  },
  D12_CONDITIONAL: {
    label: "Defense 1.2 có điều kiện",
    description: "Suất Defense 1.2 chỉ có hiệu lực khi nhóm khắc phục xong các mục bắt buộc trước hạn.",
    tone: "amber",
  },
  PENDING_D2: {
    label: "Chờ xếp Defense 2",
    description: "Defense 1.1 ở Mức 3 — nhóm cần bảo vệ lại ở Defense 2.",
    tone: "orange",
  },
  FAILED: {
    label: "Không đạt — làm lại kỳ sau",
    description: "Nhóm phải làm lại đồ án ở học kỳ sau, không được xếp lại trong kỳ này.",
    tone: "red",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    description: "Nhóm đã hoàn tất toàn bộ quy trình đánh giá của học kỳ.",
    tone: "emerald",
  },
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
  note?: string;
  resultOwner?: { name: string; code: string };
  blocksProgress: boolean;
  lockedReason?: string;
  session?: {
    startAtIso: string;
    durationMinutes: number;
    room: string;
    councilSize: number;
  };
  remediation?: {
    dueDate: string;
    verifier: { name: string; code: string };
    status: "pending" | "passed" | "overdue";
  };
}

export interface DashboardGroupMember {
  id: string;
  fullName: string;
  role: "LEADER" | "MEMBER";
  isCurrentUser?: boolean;
}

export interface StudentDashboardData {
  group: {
    code: string;
    projectTitleVi: string;
    projectTitleEn: string;
    members: DashboardGroupMember[];
    maxMembers: number;
  };
  currentStatus: GroupJourneyStatus;
  rounds: RoundResult[];
}

export const studentDashboardData: StudentDashboardData = {
  group: {
    code: "SU26SE017-G4",
    projectTitleVi: "Hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp",
    projectTitleEn: "Capstone Defense Scheduler",
    maxMembers: 5,
    members: [
      { id: "u1", fullName: "Nguyễn Văn Sinh Viên", role: "LEADER", isCurrentUser: true },
      { id: "u2", fullName: "Trần Thị Bình", role: "MEMBER" },
      { id: "u3", fullName: "Lê Hoàng Nam", role: "MEMBER" },
      { id: "u4", fullName: "Phạm Thu Hà", role: "MEMBER" },
      { id: "u5", fullName: "Đỗ Minh Quân", role: "MEMBER" },
    ],
  },
  currentStatus: "ACTIVE",
  rounds: [
    {
      id: "review-1",
      roundType: "REVIEW_1",
      label: "Review 1",
      kind: "review",
      phaseStatus: "completed",
      date: "2026-07-08",
      reviewOutcome: "Đạt",
      note: "Requirement rõ ràng, đủ căn cứ để triển khai thiết kế.",
      resultOwner: { name: "Mai Quốc Anh", code: "AnhMQ3" },
      blocksProgress: false,
    },
    {
      id: "review-2",
      roundType: "REVIEW_2",
      label: "Review 2",
      kind: "review",
      phaseStatus: "completed",
      date: "2026-07-29",
      reviewOutcome: "Cần sửa",
      note: "Hội đồng nhắc nhóm chuẩn hoá dữ liệu import trước Defense 1.1.",
      resultOwner: { name: "Mai Quốc Anh", code: "AnhMQ3" },
      blocksProgress: false,
    },
    {
      id: "defense-1-1",
      roundType: "DEFENSE_1_1",
      label: "Defense 1.1",
      kind: "defense",
      phaseStatus: "upcoming",
      date: "2026-08-20",
      blocksProgress: true,
      session: {
        startAtIso: "2026-08-20T14:00:00+07:00",
        durationMinutes: 60,
        room: "A203",
        councilSize: 3,
      },
    },
    {
      id: "defense-next",
      roundType: "DEFENSE_1_2",
      label: "Đợt tiếp theo",
      kind: "defense",
      phaseStatus: "locked",
      blocksProgress: true,
      lockedReason:
        "Tuỳ kết luận Defense 1.1: Mức 1 hoặc 2 → Defense 1.2 · Mức 3 → Defense 2 · Mức 4 → dừng lại, làm lại đồ án kỳ sau.",
    },
  ],
};

export function findRoundResult(data: StudentDashboardData, roundId: string) {
  return data.rounds.find((round) => round.id === roundId);
}
