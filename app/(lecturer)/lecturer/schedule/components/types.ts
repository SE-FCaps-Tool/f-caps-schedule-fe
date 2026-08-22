import type { RoundType } from "@/lib/api/services/fetchRounds";
import type { LecturerScheduleSession, LecturerScheduleSessionStatus } from "@/lib/api/services/fetchLecturerPortal";

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  REVIEW_1: "Review 1",
  REVIEW_2: "Review 2",
  REVIEW_3: "Review 3",
  DEFENSE_1: "Defense 1",
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
  groupId: string;
  groupCode: string;
  projectCode: string;
  status: LecturerScheduleSessionStatus;
}

export function toLecturerSession(dto: LecturerScheduleSession): LecturerSession {
  return {
    id: dto.id,
    roundType: dto.roundType,
    startAtIso: `${dto.date}T${dto.startTime}:00+07:00`,
    endAtIso: `${dto.date}T${dto.endTime}:00+07:00`,
    room: dto.roomCode ?? "Chưa gán",
    groupId: dto.groupId,
    groupCode: dto.groupCode,
    projectCode: dto.projectCode,
    status: dto.status,
  };
}
