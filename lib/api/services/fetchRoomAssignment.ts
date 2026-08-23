import apiService from "../core";
import type { RoomType } from "./fetchRounds";
import { formatInVietnamTime } from "@/lib/utils/formatDate";

/** capstone-fe-be-implementation-spec.md §8 */
export type RoomStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

/** capstone-fe-be-implementation-spec.md §7 */
export type RoundSessionStatus = "PLANNED" | "SCHEDULED" | "COMPLETED" | "POSTPONED" | "GROUP_ABSENT" | "CANCELLED";

export interface AssignableRoom {
  id: string;
  code: string;
  type: RoomType;
  status: RoomStatus;
}

export interface RoundSession {
  id: string;
  group: { id: string; code: string };
  project: { id: string; name: string };
  timeslotId: string;
  date: string;
  startTime: string;
  endTime: string;
  council: { lecturerId: string; fullName: string }[];
  roomId: string | null;
  status: RoundSessionStatus;
}

export interface AvailableRoomsParams {
  timeslotId?: string;
  type?: RoomType;
}

export interface AssignRoomPayload {
  roomId: string;
}

export interface RoomSuggestion {
  sessionId: string;
  groupCode: string;
  timeslotId: string;
  roomId: string;
  roomCode: string;
}

type SessionApi = {
  id: number;
  group_id?: number | null;
  group_code?: string | null;
  project_code?: string | null;
  timeslot_id?: number | null;
  room_id?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: string | null;
  council_members?: { lecturer_id?: number; snapshot_name?: string | null }[];
};

function adaptSession(session: SessionApi): RoundSession {
  const startAt = session.start_at ?? new Date(0).toISOString();
  const endAt = session.end_at ?? startAt;
  return {
    id: String(session.id),
    group: {
      id: String(session.group_id ?? ""),
      code: session.group_code ?? "",
    },
    project: {
      id: "",
      name: session.project_code ?? "",
    },
    timeslotId: String(session.timeslot_id ?? ""),
    date: formatInVietnamTime(startAt, "YYYY-MM-DD"),
    startTime: formatInVietnamTime(startAt, "HH:mm"),
    endTime: formatInVietnamTime(endAt, "HH:mm"),
    council: (session.council_members ?? []).map((member) => ({
      lecturerId: String(member.lecturer_id ?? ""),
      fullName: member.snapshot_name ?? "",
    })),
    roomId: session.room_id == null ? null : String(session.room_id),
    status: (session.status ?? "PLANNED") as RoundSessionStatus,
  };
}

function adaptSuggestion(suggestion: Record<string, unknown>): RoomSuggestion {
  return {
    sessionId: String(suggestion.sessionId ?? suggestion.session_id ?? ""),
    groupCode: String(suggestion.groupCode ?? suggestion.group_code ?? suggestion.groupId ?? suggestion.group_id ?? ""),
    timeslotId: String(suggestion.timeslotId ?? suggestion.timeslot_id ?? ""),
    roomId: String(suggestion.roomId ?? suggestion.room_id ?? ""),
    roomCode: String(suggestion.roomCode ?? suggestion.room_code ?? ""),
  };
}

export const fetchRoomAssignment = {
  /** GET /sessions?round_id=&version_id= — current BE manager session contract. */
  sessions: async (roundId: string, versionId: string): Promise<RoundSession[]> => {
    const response = await apiService.get<SessionApi[], { roundId: number; versionId: number }>(
      "api/v1/sessions",
      { roundId: Number(roundId), versionId: Number(versionId) }
    );
    return response.data.map(adaptSession);
  },

  /** GET /rounds/:roundId/rooms/available — spec §28/§65 */
  availableRooms: async (roundId: string, params?: AvailableRoomsParams): Promise<AssignableRoom[]> => {
    const response = await apiService.get<
      { data: Array<AssignableRoom & { room_type?: RoomType; active?: boolean }> },
      AvailableRoomsParams
    >(`api/v1/rounds/${roundId}/rooms/available`, params);
    return response.data.data.map((room) => ({
      ...room,
      id: String(room.id),
      type: room.type ?? room.room_type ?? "NORMAL",
      status: room.status ?? (room.active === false ? "INACTIVE" : "ACTIVE"),
    }));
  },

  /** PUT /sessions/:sessionId/room — spec §28/§66 */
  assignRoom: async (sessionId: string, payload: AssignRoomPayload): Promise<void> => {
    await apiService.put(`api/v1/sessions/${sessionId}/room`, payload);
  },

  /** POST /rounds/:roundId/rooms/suggest — spec §28/§67. Không ảnh hưởng điểm solver, chỉ tính gợi ý để preview */
  suggestRooms: async (roundId: string): Promise<RoomSuggestion[]> => {
    const response = await apiService.post<{ data: { suggestions: Record<string, unknown>[] } }, undefined>(
      `api/v1/rounds/${roundId}/rooms/suggest`
    );
    return (response.data.data.suggestions ?? []).map(adaptSuggestion);
  },

  /** POST /rounds/:roundId/rooms/apply-suggestions — spec §28/§68. Validate hết rồi mới commit atomic */
  applySuggestions: async (roundId: string, suggestions: RoomSuggestion[]): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/rooms/apply-suggestions`, {
      assignments: suggestions.map((suggestion) => ({
        session_id: Number(suggestion.sessionId),
        room_id: Number(suggestion.roomId),
      })),
    });
  },
};
