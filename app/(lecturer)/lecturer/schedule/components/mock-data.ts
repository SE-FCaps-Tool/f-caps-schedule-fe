import type { RoundType, SessionStatus } from "@/types/models";

// TODO: thay bằng dữ liệu thật từ API khi backend sẵn sàng (FR-8.1).
// Shape cố ý bám theo types/models.ts (Session, Round, Council...) để việc
// nối API sau này chỉ là đổi nguồn dữ liệu, không đổi component.

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
};

export function roundKind(type: RoundType): "review" | "defense" {
  return type === "REVIEW_1" || type === "REVIEW_2" ? "review" : "defense";
}

export interface LecturerSession {
  id: string;
  roundType: RoundType;
  startAtIso: string;
  endAtIso: string;
  room: string;
  isOnline: boolean;
  groupCode: string;
  groupTitleVi: string;
  myRole: "Reviewer" | "Result Owner";
  councilMembers: string[];
  status: SessionStatus;
}

// "Hôm nay" mô phỏng — currentDate của phiên làm việc là 2026-08-18 (thứ Ba).
const D = (offsetDays: number, hh: number, mm = 0) => {
  const base = new Date("2026-08-18T00:00:00+07:00");
  base.setDate(base.getDate() + offsetDays);
  base.setHours(hh, mm, 0, 0);
  return base.toISOString();
};

export const lecturerSessions: LecturerSession[] = [
  {
    id: "s-1",
    roundType: "REVIEW_1",
    startAtIso: D(-5, 9, 0),
    endAtIso: D(-5, 9, 45),
    room: "A203",
    isOnline: false,
    groupCode: "SU26SE009-G2",
    groupTitleVi: "Nền tảng quản lý kho thông minh cho hộ kinh doanh nhỏ",
    myRole: "Reviewer",
    councilMembers: ["Mai Quốc Anh", "Trịnh Bảo Long"],
    status: "COMPLETED",
  },
  {
    id: "s-2",
    roundType: "REVIEW_1",
    startAtIso: D(-5, 10, 0),
    endAtIso: D(-5, 10, 45),
    room: "A203",
    isOnline: false,
    groupCode: "SU26SE014-G6",
    groupTitleVi: "Ứng dụng theo dõi sức khoẻ tâm lý sinh viên",
    myRole: "Result Owner",
    councilMembers: ["Mai Quốc Anh", "Trịnh Bảo Long"],
    status: "COMPLETED",
  },
  {
    id: "s-3",
    roundType: "REVIEW_2",
    startAtIso: D(-2, 14, 0),
    endAtIso: D(-2, 14, 45),
    room: "Online — Google Meet",
    isOnline: true,
    groupCode: "SU26SE003-G1",
    groupTitleVi: "Hệ thống gợi ý lộ trình học cá nhân hoá bằng AI",
    myRole: "Reviewer",
    councilMembers: ["Phan Đức Hiển"],
    status: "COMPLETED",
  },
  {
    id: "s-4",
    roundType: "DEFENSE_1_1",
    startAtIso: D(0, 8, 30),
    endAtIso: D(0, 9, 30),
    room: "B105",
    isOnline: false,
    groupCode: "SU26SE021-G8",
    groupTitleVi: "Nền tảng đặt lịch khám bệnh từ xa cho phòng khám tư",
    myRole: "Reviewer",
    councilMembers: ["Nguyễn Thảo My", "Đặng Văn Khoa"],
    status: "COMPLETED",
  },
  {
    id: "s-5",
    roundType: "DEFENSE_1_1",
    startAtIso: D(0, 14, 0),
    endAtIso: D(0, 15, 0),
    room: "B105",
    isOnline: false,
    groupCode: "SU26SE017-G4",
    groupTitleVi: "Hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp",
    myRole: "Result Owner",
    councilMembers: ["Nguyễn Thảo My", "Đặng Văn Khoa"],
    status: "ONGOING",
  },
  {
    id: "s-6",
    roundType: "DEFENSE_1_1",
    startAtIso: D(1, 9, 0),
    endAtIso: D(1, 10, 0),
    room: "B105",
    isOnline: false,
    groupCode: "SU26SE028-G11",
    groupTitleVi: "Ứng dụng quản lý chi tiêu nhóm cho sinh viên ở trọ",
    myRole: "Reviewer",
    councilMembers: ["Nguyễn Thảo My", "Đặng Văn Khoa"],
    status: "SCHEDULED",
  },
  {
    id: "s-7",
    roundType: "REVIEW_2",
    startAtIso: D(3, 13, 30),
    endAtIso: D(3, 14, 15),
    room: "Online — Google Meet",
    isOnline: true,
    groupCode: "SU26SE003-G1",
    groupTitleVi: "Hệ thống gợi ý lộ trình học cá nhân hoá bằng AI",
    myRole: "Reviewer",
    councilMembers: ["Phan Đức Hiển"],
    status: "POSTPONED",
  },
  {
    id: "s-8",
    roundType: "DEFENSE_1_1",
    startAtIso: D(4, 10, 0),
    endAtIso: D(4, 11, 0),
    room: "B107",
    isOnline: false,
    groupCode: "SU26SE031-G13",
    groupTitleVi: "Cổng thông tin thực tập kết nối sinh viên và doanh nghiệp",
    myRole: "Reviewer",
    councilMembers: ["Vũ Thành Đạt", "Lê Minh Trang"],
    status: "SCHEDULED",
  },
  {
    id: "s-9",
    roundType: "DEFENSE_1_1",
    startAtIso: D(6, 8, 0),
    endAtIso: D(6, 9, 0),
    room: "B107",
    isOnline: false,
    groupCode: "SU26SE034-G15",
    groupTitleVi: "Hệ thống chấm điểm rèn luyện tự động theo minh chứng",
    myRole: "Reviewer",
    councilMembers: ["Vũ Thành Đạt", "Lê Minh Trang"],
    status: "SCHEDULED",
  },
  {
    id: "s-10",
    roundType: "DEFENSE_1_2",
    startAtIso: D(11, 9, 0),
    endAtIso: D(11, 10, 30),
    room: "A210",
    isOnline: false,
    groupCode: "SU26SE009-G2",
    groupTitleVi: "Nền tảng quản lý kho thông minh cho hộ kinh doanh nhỏ",
    myRole: "Reviewer",
    councilMembers: ["Mai Quốc Anh", "Trịnh Bảo Long", "Hoàng Gia Bảo", "Đỗ Ngọc Diễm"],
    status: "SCHEDULED",
  },
];
