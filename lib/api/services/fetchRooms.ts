import apiService from "../core";
import type { RoomType } from "./fetchRounds";
import type { RoomStatus } from "./fetchRoomAssignment";

export interface RoomApiItem {
  id: number;
  code: string;
  name: string;
  capacity: number;
  /** Optional until BE trả field này — xem docs/be-checklist-open-questions.md A4 */
  type?: RoomType;
  status?: RoomStatus;
}

export interface RoomCreatePayload {
  code: string;
  name: string;
  capacity: number;
  type: RoomType;
}

export interface RoomUpdatePayload {
  name?: string;
  capacity?: number;
  type?: RoomType;
  status?: RoomStatus;
}

export const fetchRooms = {
  /** GET /rooms — ADMIN, MANAGER */
  list: async (): Promise<RoomApiItem[]> => {
    const response = await apiService.get<RoomApiItem[]>("api/v1/rooms");
    return response.data;
  },

  /** POST /rooms — ADMIN only */
  create: async (payload: RoomCreatePayload): Promise<RoomApiItem> => {
    const response = await apiService.post<RoomApiItem>("api/v1/rooms", payload);
    return response.data;
  },

  /** PATCH /rooms/:roomId — ADMIN, MANAGER */
  update: async (roomId: number, payload: RoomUpdatePayload): Promise<RoomApiItem> => {
    const response = await apiService.patch<RoomApiItem>(`api/v1/rooms/${roomId}`, payload);
    return response.data;
  },
};
