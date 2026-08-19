import type { RoundType } from "@/lib/api/services/fetchRounds";
import type { LeaderSession, LeaderSessionStatus } from "@/lib/api/services/fetchLeaderPortal";

export type ScheduleTone = "neutral" | "orange" | "emerald" | "amber" | "sky" | "red";

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  DEFENSE_1_1: "Defense 1.1",
  DEFENSE_1_2: "Defense 1.2",
  DEFENSE_2: "Defense 2",
};

export const SESSION_STATUS_LABEL: Record<LeaderSessionStatus, string> = {
  SCHEDULED: "Sắp diễn ra",
  COMPLETED: "Đã hoàn tất",
  POSTPONED: "Đã hoãn",
  GROUP_ABSENT: "Nhóm vắng mặt",
  CANCELLED: "Đã huỷ",
};

export const SESSION_STATUS_TONE: Record<LeaderSessionStatus, ScheduleTone> = {
  SCHEDULED: "orange",
  COMPLETED: "emerald",
  POSTPONED: "amber",
  GROUP_ABSENT: "red",
  CANCELLED: "red",
};

export interface ScheduleReviewer {
  id: string;
  name: string;
}

/** kind luôn là "official" — GET /leader/me/sessions chỉ trả Session thật, không trả khung
 * ưu tiên/còn chỗ (những khung đó thuộc domain Group Preference, xem /student/preferences). */
export interface ScheduleSlot {
  id: string;
  title: string;
  kind: "official";
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
  reviewers?: ScheduleReviewer[];
}

export interface ScheduleDay {
  date: string;
  sessions: ScheduleSlot[];
}

export interface ScheduleRoundSummary {
  label: string;
  value: string;
  detail: string;
  tone: ScheduleTone;
}

export interface ScheduleRound {
  id: RoundType;
  type: RoundType;
  label: string;
  description: string;
  /** suy luận từ trạng thái các Session thuộc round này — không phải EvaluationRoundStatus thật
   * (Leader không có API lấy RoundStatus cho round đã publish, chỉ có currentRound trên Dashboard). */
  status: LeaderSessionStatus;
  statusLabel: string;
  durationMinutes: number;
  councilSize: number;
  days: ScheduleDay[];
  summaries: ScheduleRoundSummary[];
}

export interface StudentScheduleData {
  group: { code: string; projectTitleEn: string | null };
  nextSessionId: string;
  initialRoundId: string;
  rounds: ScheduleRound[];
}

function minutesBetween(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function aggregateRoundStatus(sessions: LeaderSession[]): LeaderSessionStatus {
  if (sessions.some((s) => s.status === "POSTPONED")) return "POSTPONED";
  if (sessions.some((s) => s.status === "GROUP_ABSENT")) return "GROUP_ABSENT";
  if (sessions.some((s) => s.status === "SCHEDULED")) return "SCHEDULED";
  if (sessions.every((s) => s.status === "CANCELLED")) return "CANCELLED";
  return "COMPLETED";
}

function toScheduleSlot(session: LeaderSession): ScheduleSlot {
  const durationMinutes = minutesBetween(session.startTime, session.endTime);
  return {
    id: session.id,
    title: `${ROUND_TYPE_LABEL[session.round.type]} · ${session.round.name}`,
    kind: "official",
    tone: SESSION_STATUS_TONE[session.status],
    date: session.date,
    startAt: `${session.date}T${session.startTime}:00+07:00`,
    endAt: `${session.date}T${session.endTime}:00+07:00`,
    startTime: session.startTime,
    endTime: session.endTime,
    statusLabel: SESSION_STATUS_LABEL[session.status],
    durationMinutes,
    room: session.roomCode ?? undefined,
    councilCode: undefined,
    reviewers: session.council.map((c, index) => ({ id: `${session.id}-council-${index}`, name: c.name })),
  };
}

export function toStudentScheduleData(
  group: { code: string; projectTitleEn: string | null },
  sessions: LeaderSession[]
): StudentScheduleData {
  const byType = new Map<RoundType, LeaderSession[]>();
  for (const session of sessions) {
    const list = byType.get(session.round.type) ?? [];
    list.push(session);
    byType.set(session.round.type, list);
  }

  const rounds: ScheduleRound[] = Array.from(byType.entries()).map(([type, roundSessions]) => {
    const status = aggregateRoundStatus(roundSessions);
    const slots = roundSessions
      .map(toScheduleSlot)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    const days = new Map<string, ScheduleSlot[]>();
    for (const slot of slots) {
      const list = days.get(slot.date) ?? [];
      list.push(slot);
      days.set(slot.date, list);
    }
    const councilSize = Math.max(0, ...roundSessions.map((s) => s.council.length));
    const durationMinutes = Math.max(0, ...roundSessions.map((s) => minutesBetween(s.startTime, s.endTime)));

    return {
      id: type,
      type,
      label: roundSessions[0]?.round.name ?? ROUND_TYPE_LABEL[type],
      description: `Lịch chính thức của nhóm cho ${ROUND_TYPE_LABEL[type]}.`,
      status,
      statusLabel: SESSION_STATUS_LABEL[status],
      durationMinutes,
      councilSize,
      days: Array.from(days.entries()).map(([date, daySlots]) => ({ date, sessions: daySlots })),
      summaries: [
        { label: "Buổi", value: `${roundSessions.length} buổi`, detail: ROUND_TYPE_LABEL[type], tone: "sky" },
        { label: "Hội đồng", value: `${councilSize} reviewer`, detail: "Theo từng buổi", tone: "sky" },
      ],
    };
  });

  const firstUpcoming = rounds
    .flatMap((r) => r.days.flatMap((d) => d.sessions))
    .find((s) => s.statusLabel === SESSION_STATUS_LABEL.SCHEDULED);

  return {
    group,
    nextSessionId: firstUpcoming?.id ?? rounds[0]?.days[0]?.sessions[0]?.id ?? "",
    initialRoundId: rounds[0]?.id ?? "",
    rounds,
  };
}
