import type { RoundType } from "@/lib/api/services/fetchRounds";
import type {
  LecturerScheduleSession,
  LecturerScheduleSessionStatus,
  LecturerSessionRole,
} from "@/lib/api/services/fetchLecturerPortal";

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

export const MY_ROLE_LABEL: Record<LecturerSessionRole, string> = {
  REVIEWER: "Reviewer",
  RESULT_OWNER: "Result Owner",
};

export interface LecturerSession {
  id: string;
  roundType: RoundType;
  startAtIso: string;
  endAtIso: string;
  room: string;
  groupId: string;
  groupCode: string;
  groupTitleVi: string;
  myRole: LecturerSessionRole;
  councilMembers: string[];
  status: LecturerScheduleSessionStatus;
}

export function toLecturerSession(dto: LecturerScheduleSession): LecturerSession | null {
  if (!dto.round || !dto.group) return null;
  return {
    id: dto.id,
    roundType: dto.round.type,
    startAtIso: `${dto.date}T${dto.startTime}:00+07:00`,
    endAtIso: `${dto.date}T${dto.endTime}:00+07:00`,
    room: dto.roomCode ?? "Chưa gán",
    groupId: dto.group.id,
    groupCode: dto.group.code,
    groupTitleVi: dto.group.projectTitle ?? "",
    myRole: dto.myRole,
    councilMembers: dto.council.map((c) => c.name),
    status: dto.status,
  };
}
