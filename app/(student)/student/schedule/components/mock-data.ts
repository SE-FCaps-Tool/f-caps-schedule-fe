import type { RoundStatus, RoundType, SessionStatus } from "@/types/models";

export type ScheduleTone = "neutral" | "orange" | "emerald" | "amber" | "sky" | "red";

export interface ScheduleReviewer {
  id: string;
  name: string;
  code: string;
  note?: string;
  isResultOwner?: boolean;
  isCarriedFromPrevious?: boolean;
}

export interface ScheduleRuleCheck {
  code:
    | "H1"
    | "H2"
    | "H3"
    | "H5"
    | "H10"
    | "H11"
    | "H13"
    | "BR-PUB-04"
    | "BR-STU-03";
  label: string;
  status: "passed" | "warning" | "info";
}

export interface ScheduleSlot {
  id: string;
  title: string;
  kind: "official" | "preferred" | "available" | "not-selected" | "empty";
  tone: ScheduleTone;
  date: string;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  statusLabel: string;
  durationMinutes: number;
  room?: string;
  councilCode?: string;
  sessionStatus?: SessionStatus;
  reviewers?: ScheduleReviewer[];
  slotCapacity?: {
    used: number;
    max: number;
  };
  ruleChecks: ScheduleRuleCheck[];
  auditTrail?: string[];
  note?: string;
}

export interface ScheduleDay {
  id: string;
  date: string;
  weekday: string;
  label: string;
  sessions: ScheduleSlot[];
}

export interface ScheduleRoundSummary {
  label: string;
  value: string;
  detail: string;
  tone: ScheduleTone;
}

export interface ScheduleRound {
  id: string;
  type: RoundType;
  label: string;
  description: string;
  status: RoundStatus;
  statusLabel: string;
  durationMinutes: number;
  councilSize: number;
  maxGroupsPerTimeslot: number;
  groupSelectionMode: boolean;
  registrationDeadline?: string;
  scheduleVersionLabel?: string;
  days: ScheduleDay[];
  summaries: ScheduleRoundSummary[];
  emptyState?: {
    title: string;
    description: string;
  };
}

export interface StudentScheduleData {
  semester: {
    code: string;
    timezoneLabel: string;
  };
  group: {
    code: string;
    projectCode: string;
    projectTitleVi: string;
    projectTitleEn: string;
    statusLabel: string;
    memberCount: number;
    maxMembers: number;
    leaderName: string;
    supervisors: string[];
  };
  nextSessionId: string;
  initialRoundId: string;
  rounds: ScheduleRound[];
}

const defaultChecks: ScheduleRuleCheck[] = [
  { code: "H1", label: "GVHD không nằm trong hội đồng", status: "passed" },
  { code: "H2", label: "Reviewer không trùng khung giờ", status: "passed" },
  { code: "H3", label: "Phòng không trùng khung giờ", status: "passed" },
];

const d11Reviewers: ScheduleReviewer[] = [
  { id: "lec-1", name: "Nguyễn Trọng Tài", code: "TaiNT51", isResultOwner: true },
  { id: "lec-2", name: "Trần Thị Hương", code: "HuongTT29" },
  { id: "lec-3", name: "Lê Minh Khoa", code: "KhoaLM8" },
];

export const studentScheduleData: StudentScheduleData = {
  semester: {
    code: "SU26",
    timezoneLabel: "UTC+7 · Asia/Bangkok",
  },
  group: {
    code: "SU26SE017-G4",
    projectCode: "SU26SE017",
    projectTitleVi: "Hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp",
    projectTitleEn: "Capstone Defense Scheduler",
    statusLabel: "ACTIVE",
    memberCount: 5,
    maxMembers: 5,
    leaderName: "Nguyễn Văn Sinh Viên",
    supervisors: ["Phạm Anh Đức", "Võ Thu Hà"],
  },
  nextSessionId: "defense-1-1-official",
  initialRoundId: "defense-1-1",
  rounds: [
    {
      id: "review-1",
      type: "REVIEW_1",
      label: "Review 1",
      description: "Đánh giá Requirement. Kết quả Review chỉ cảnh báo sớm, không chặn Defense 1.1.",
      status: "COMPLETED",
      statusLabel: "Đã hoàn tất",
      durationMinutes: 45,
      councilSize: 2,
      maxGroupsPerTimeslot: 13,
      groupSelectionMode: false,
      scheduleVersionLabel: "Active version R1-SU26-v03",
      days: [
        {
          id: "r1-day-1",
          date: "2026-07-08",
          weekday: "Thứ tư",
          label: "08/07",
          sessions: [
            {
              id: "review-1-official",
              title: "Review 1 · Requirement",
              kind: "official",
              tone: "emerald",
              date: "2026-07-08",
              startAt: "2026-07-08T08:00:00+07:00",
              endAt: "2026-07-08T08:45:00+07:00",
              startTime: "08:00",
              endTime: "08:45",
              statusLabel: "Đạt",
              durationMinutes: 45,
              room: "B508",
              councilCode: "R1-C04",
              sessionStatus: "COMPLETED",
              reviewers: [
                { id: "lec-4", name: "Đỗ Thanh Bình", code: "BinhDT12" },
                { id: "lec-5", name: "Mai Quốc Anh", code: "AnhMQ3", isResultOwner: true },
              ],
              slotCapacity: { used: 9, max: 13 },
              ruleChecks: [...defaultChecks, { code: "H5", label: "Đủ 2 reviewer cho Review", status: "passed" }],
              auditTrail: ["Công bố lúc 01/07/2026 15:20", "Kết quả nhập lúc 08/07/2026 10:12"],
            },
          ],
        },
      ],
      summaries: [
        { label: "Thời lượng", value: "45 phút", detail: "Mặc định Review 1", tone: "neutral" },
        { label: "Hội đồng", value: "2 reviewer", detail: "Không phải GVHD", tone: "sky" },
        { label: "Kết quả", value: "Đạt", detail: "Không đổi trạng thái nhóm", tone: "emerald" },
      ],
    },
    {
      id: "review-2",
      type: "REVIEW_2",
      label: "Review 2",
      description: "Đánh giá ERD, cơ sở dữ liệu và công nghệ. Ưu tiên giữ cặp reviewer từ Review 1 nếu hợp lệ.",
      status: "COMPLETED",
      statusLabel: "Đã hoàn tất",
      durationMinutes: 45,
      councilSize: 2,
      maxGroupsPerTimeslot: 13,
      groupSelectionMode: false,
      scheduleVersionLabel: "Active version R2-SU26-v02",
      days: [
        {
          id: "r2-day-1",
          date: "2026-07-29",
          weekday: "Thứ tư",
          label: "29/07",
          sessions: [
            {
              id: "review-2-official",
              title: "Review 2 · ERD & công nghệ",
              kind: "official",
              tone: "emerald",
              date: "2026-07-29",
              startAt: "2026-07-29T13:30:00+07:00",
              endAt: "2026-07-29T14:15:00+07:00",
              startTime: "13:30",
              endTime: "14:15",
              statusLabel: "Đạt có lưu ý",
              durationMinutes: 45,
              room: "A305",
              councilCode: "R2-C04",
              sessionStatus: "COMPLETED",
              reviewers: [
                { id: "lec-4", name: "Đỗ Thanh Bình", code: "BinhDT12", isCarriedFromPrevious: true },
                { id: "lec-5", name: "Mai Quốc Anh", code: "AnhMQ3", isResultOwner: true, isCarriedFromPrevious: true },
              ],
              slotCapacity: { used: 7, max: 13 },
              ruleChecks: [
                ...defaultChecks,
                { code: "H5", label: "Đủ 2 reviewer cho Review", status: "passed" },
              ],
              auditTrail: ["Công bố lúc 24/07/2026 09:10", "Reviewer giữ nguyên từ Review 1 theo S3"],
              note: "Hội đồng nhắc nhóm chuẩn hoá dữ liệu import trước Defense 1.1.",
            },
          ],
        },
      ],
      summaries: [
        { label: "Thời lượng", value: "45 phút", detail: "Mặc định Review 2", tone: "neutral" },
        { label: "Hội đồng", value: "2 reviewer", detail: "Giữ cặp R1 theo S3", tone: "sky" },
        { label: "Kết quả", value: "Đạt có lưu ý", detail: "Cảnh báo sớm", tone: "amber" },
      ],
    },
    {
      id: "defense-1-1",
      type: "DEFENSE_1_1",
      label: "Defense 1.1",
      description: "Phiên bảo vệ chính với 3 reviewer. Kết quả quyết định nhóm đi D1.2, D1.2 có điều kiện, D2 hoặc failed.",
      status: "PUBLISHED",
      statusLabel: "Đã công bố",
      durationMinutes: 60,
      councilSize: 3,
      maxGroupsPerTimeslot: 8,
      groupSelectionMode: false,
      scheduleVersionLabel: "Active version D11-SU26-v05",
      days: [
        {
          id: "d11-day-1",
          date: "2026-08-20",
          weekday: "Thứ năm",
          label: "20/08",
          sessions: [
            {
              id: "defense-1-1-official",
              title: "Defense 1.1 · Phiên chính thức",
              kind: "official",
              tone: "orange",
              date: "2026-08-20",
              startAt: "2026-08-20T09:00:00+07:00",
              endAt: "2026-08-20T10:00:00+07:00",
              startTime: "09:00",
              endTime: "10:00",
              statusLabel: "Sắp diễn ra",
              durationMinutes: 60,
              room: "A203",
              councilCode: "D11-C06",
              sessionStatus: "SCHEDULED",
              reviewers: d11Reviewers,
              slotCapacity: { used: 6, max: 8 },
              ruleChecks: [
                ...defaultChecks,
                { code: "H5", label: "Đủ 3 reviewer cho Defense 1.1", status: "passed" },
                { code: "BR-PUB-04", label: "Đổi phòng sau công bố có audit log", status: "info" },
              ],
              auditTrail: [
                "Công bố lúc 18/08/2026 10:15",
                "Đổi phòng A201 → A203 lúc 18/08/2026 15:40: phòng A201 bảo trì máy chiếu",
              ],
              note: "Nhóm có mặt trước 15 phút. Lịch đã qua kiểm H1/H2/H3 nên GVHD không ngồi hội đồng.",
            },
            {
              id: "d11-context-1",
              title: "Khung song song",
              kind: "empty",
              tone: "neutral",
              date: "2026-08-20",
              startAt: "2026-08-20T10:15:00+07:00",
              endAt: "2026-08-20T11:15:00+07:00",
              startTime: "10:15",
              endTime: "11:15",
              statusLabel: "Nhóm khác",
              durationMinutes: 60,
              slotCapacity: { used: 8, max: 8 },
              ruleChecks: [],
              note: "Hiển thị để nhóm hiểu vì sao không thể tự đổi sang khung đã đầy.",
            },
          ],
        },
        {
          id: "d11-day-2",
          date: "2026-08-21",
          weekday: "Thứ sáu",
          label: "21/08",
          sessions: [
            {
              id: "d11-context-3",
              title: "Khung dự phòng sáng",
              kind: "available",
              tone: "sky",
              date: "2026-08-21",
              startAt: "2026-08-21T11:00:00+07:00",
              endAt: "2026-08-21T13:00:00+07:00",
              startTime: "11:00",
              endTime: "13:00",
              statusLabel: "Slot bù",
              durationMinutes: 120,
              slotCapacity: { used: 1, max: 8 },
              ruleChecks: [
                { code: "H3", label: "Phòng sẽ được gán khi có phiên bù", status: "info" },
              ],
              note: "Chỉ dùng nếu Moderator duyệt hoãn/đổi lịch.",
            },
            {
              id: "d11-context-2",
              title: "Khung dự phòng",
              kind: "available",
              tone: "sky",
              date: "2026-08-21",
              startAt: "2026-08-21T13:30:00+07:00",
              endAt: "2026-08-21T14:30:00+07:00",
              startTime: "13:30",
              endTime: "14:30",
              statusLabel: "Slot bù",
              durationMinutes: 60,
              slotCapacity: { used: 2, max: 8 },
              ruleChecks: [
                { code: "H3", label: "Phòng sẽ được gán khi có phiên bù", status: "info" },
              ],
              note: "Chỉ dùng nếu Moderator duyệt hoãn/đổi lịch.",
            },
            {
              id: "d11-context-4",
              title: "Khung dự phòng chiều",
              kind: "available",
              tone: "sky",
              date: "2026-08-21",
              startAt: "2026-08-21T14:00:00+07:00",
              endAt: "2026-08-21T15:00:00+07:00",
              startTime: "14:00",
              endTime: "15:00",
              statusLabel: "Slot bù",
              durationMinutes: 60,
              slotCapacity: { used: 3, max: 8 },
              ruleChecks: [
                { code: "H3", label: "Phòng sẽ được gán khi có phiên bù", status: "info" },
              ],
              note: "Chỉ dùng nếu Moderator duyệt hoãn/đổi lịch.",
            },
          ],
        },
      ],
      summaries: [
        { label: "Thời lượng", value: "60 phút", detail: "Mặc định Defense 1.1", tone: "neutral" },
        { label: "Hội đồng", value: "3 reviewer", detail: "Reviewer ngang hàng", tone: "sky" },
        { label: "Trạng thái", value: "Đã công bố", detail: "Có audit khi đổi phòng", tone: "orange" },
      ],
    },
    {
      id: "defense-1-2",
      type: "DEFENSE_1_2",
      label: "Defense 1.2",
      description: "Đợt Defense dài nhất: 90 phút, 5 reviewer. Khi xếp lịch phải giữ ít nhất 1 reviewer từng chấm D1.1.",
      status: "OPEN_REGISTRATION",
      statusLabel: "Đang chọn khung",
      durationMinutes: 90,
      councilSize: 5,
      maxGroupsPerTimeslot: 5,
      groupSelectionMode: true,
      registrationDeadline: "2026-08-23T17:30:00+07:00",
      days: [
        {
          id: "d12-day-1",
          date: "2026-08-27",
          weekday: "Thứ năm",
          label: "27/08",
          sessions: [
            {
              id: "d12-preferred-1",
              title: "Ưu tiên sáng",
              kind: "preferred",
              tone: "orange",
              date: "2026-08-27",
              startAt: "2026-08-27T08:00:00+07:00",
              endAt: "2026-08-27T09:30:00+07:00",
              startTime: "08:00",
              endTime: "09:30",
              statusLabel: "Nhóm đã chọn",
              durationMinutes: 90,
              slotCapacity: { used: 4, max: 5 },
              ruleChecks: [
                { code: "H10", label: "Hợp lệ vì leader đã chọn khung", status: "passed" },
                { code: "H11", label: "Sẽ giữ ít nhất 1 reviewer từ D1.1", status: "info" },
              ],
              note: "Phòng và hội đồng sẽ được gán sau khi Moderator đóng đăng ký và chạy lịch.",
            },
            {
              id: "d12-available-1",
              title: "Khung còn chỗ",
              kind: "available",
              tone: "sky",
              date: "2026-08-27",
              startAt: "2026-08-27T09:45:00+07:00",
              endAt: "2026-08-27T11:15:00+07:00",
              startTime: "09:45",
              endTime: "11:15",
              statusLabel: "Chưa chọn",
              durationMinutes: 90,
              slotCapacity: { used: 3, max: 5 },
              ruleChecks: [
                { code: "H10", label: "Không được xếp nếu nhóm không chọn trước deadline", status: "warning" },
              ],
              note: "Leader có thể thêm khung này trước deadline.",
            },
            {
              id: "d12-preferred-2",
              title: "Ưu tiên chiều",
              kind: "preferred",
              tone: "orange",
              date: "2026-08-27",
              startAt: "2026-08-27T13:30:00+07:00",
              endAt: "2026-08-27T15:00:00+07:00",
              startTime: "13:30",
              endTime: "15:00",
              statusLabel: "Nhóm đã chọn",
              durationMinutes: 90,
              slotCapacity: { used: 5, max: 5 },
              ruleChecks: [
                { code: "H10", label: "Hợp lệ vì leader đã chọn khung", status: "passed" },
                { code: "H13", label: "Khung đã đạt trần 5 nhóm", status: "warning" },
              ],
              note: "Khung này đông, thuật toán có thể ưu tiên khung ít tải hơn nếu vẫn thỏa H10.",
            },
          ],
        },
        {
          id: "d12-day-2",
          date: "2026-08-28",
          weekday: "Thứ sáu",
          label: "28/08",
          sessions: [
            {
              id: "d12-not-selected-1",
              title: "Không chọn",
              kind: "not-selected",
              tone: "neutral",
              date: "2026-08-28",
              startAt: "2026-08-28T08:00:00+07:00",
              endAt: "2026-08-28T09:30:00+07:00",
              startTime: "08:00",
              endTime: "09:30",
              statusLabel: "Ngoài lựa chọn",
              durationMinutes: 90,
              slotCapacity: { used: 1, max: 5 },
              ruleChecks: [
                { code: "H10", label: "Có lựa chọn khác nên hệ thống không xếp vào khung này", status: "info" },
              ],
              note: "BR-AVL-07 chỉ mặc định rảnh mọi slot khi nhóm không chọn slot nào.",
            },
            {
              id: "d12-preferred-3",
              title: "Ưu tiên cuối",
              kind: "preferred",
              tone: "orange",
              date: "2026-08-28",
              startAt: "2026-08-28T15:15:00+07:00",
              endAt: "2026-08-28T16:45:00+07:00",
              startTime: "15:15",
              endTime: "16:45",
              statusLabel: "Nhóm đã chọn",
              durationMinutes: 90,
              slotCapacity: { used: 2, max: 5 },
              ruleChecks: [
                { code: "H10", label: "Hợp lệ vì leader đã chọn khung", status: "passed" },
                { code: "H11", label: "Sẽ giữ ít nhất 1 reviewer từ D1.1", status: "info" },
              ],
              note: "Khung có tải nhẹ hơn, phù hợp nếu Bộ môn ưu tiên cân bằng tải reviewer.",
            },
          ],
        },
      ],
      summaries: [
        { label: "Thời lượng", value: "90 phút", detail: "Nút thắt của kỳ", tone: "amber" },
        { label: "Hội đồng", value: "5 reviewer", detail: "Tối đa 5 nhóm/khung", tone: "sky" },
        { label: "Lựa chọn", value: "3 khung", detail: "Leader đã chọn", tone: "orange" },
      ],
    },
    {
      id: "defense-2",
      type: "DEFENSE_2",
      label: "Defense 2",
      description: "Chỉ áp dụng nếu nhóm nhận mức 3 ở Defense 1.1. Nhóm failed không được xếp Defense 2 trong kỳ hiện tại.",
      status: "DRAFT",
      statusLabel: "Chưa áp dụng",
      durationMinutes: 90,
      councilSize: 5,
      maxGroupsPerTimeslot: 5,
      groupSelectionMode: false,
      days: [],
      summaries: [
        { label: "Điều kiện", value: "Mức 3", detail: "Sau D1.1", tone: "neutral" },
        { label: "Hội đồng", value: "5 reviewer", detail: "Theo rule Defense 2", tone: "sky" },
        { label: "Trạng thái", value: "Chưa mở", detail: "Không cần thao tác", tone: "neutral" },
      ],
      emptyState: {
        title: "Nhóm chưa cần lịch Defense 2",
        description: "Defense 2 chỉ xuất hiện nếu kết quả Defense 1.1 là mức 3. Mức 4 sẽ failed ngay và không được xếp D2.",
      },
    },
  ],
};

export function findScheduleSlot(data: StudentScheduleData, slotId: string) {
  return data.rounds
    .flatMap((round) => round.days.flatMap((day) => day.sessions))
    .find((slot) => slot.id === slotId);
}
