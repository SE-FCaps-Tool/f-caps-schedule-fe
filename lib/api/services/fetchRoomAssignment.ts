import apiService from "../core";
import type { RoomType } from "./fetchRounds";

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

export const fetchRoomAssignment = {
  /** GET /rounds/:roundId/sessions?versionId= — spec §27, nguồn dữ liệu cho grid gán phòng */
  sessions: async (roundId: string, versionId: string): Promise<RoundSession[]> => {
    const response = await apiService.get<{ data: RoundSession[] }>(`api/v1/rounds/${roundId}/sessions`, { versionId });
    return response.data.data;
  },

  /** GET /rounds/:roundId/rooms/available — spec §28/§65 */
  availableRooms: async (roundId: string, params?: AvailableRoomsParams): Promise<AssignableRoom[]> => {
    const response = await apiService.get<{ data: AssignableRoom[] }>(`api/v1/rounds/${roundId}/rooms/available`, params);
    return response.data.data;
  },

  /** PUT /sessions/:sessionId/room — spec §28/§66 */
  assignRoom: async (sessionId: string, payload: AssignRoomPayload): Promise<void> => {
    await apiService.put(`api/v1/sessions/${sessionId}/room`, payload);
  },

  /** POST /rounds/:roundId/rooms/suggest — spec §28/§67. Không ảnh hưởng điểm solver, chỉ tính gợi ý để preview */
  suggestRooms: async (roundId: string): Promise<RoomSuggestion[]> => {
    const response = await apiService.post<{ data: RoomSuggestion[] }>(`api/v1/rounds/${roundId}/rooms/suggest`);
    return response.data.data;
  },

  /** POST /rounds/:roundId/rooms/apply-suggestions — spec §28/§68. Validate hết rồi mới commit atomic */
  applySuggestions: async (roundId: string): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/rooms/apply-suggestions`);
  },
};
