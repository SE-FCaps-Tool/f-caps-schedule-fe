import apiService from "../core";
import type { RoomType } from "./fetchRounds";
import type { RoomStatus } from "./fetchRoomAssignment";
import { snakeizeKeys } from "../caseConvert";
import type { ListMeta, ListResponse } from "@/types/api";

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

export interface RoomListParams {
  page?: number;
  pageSize?: number;
}

export const fetchRooms = {
  /**
   * GET /rooms — ADMIN, MANAGER.
   * BE trả `{data: [...camelCase], meta: {page,pageSize,total}}` qua success_payload()
   * (xem docs/be-checklist-open-questions.md mục 6) — unwrap + snakeize để khớp RoomApiItem.
   */
  list: async (params?: RoomListParams): Promise<ListResponse<RoomApiItem>> => {
    const response = await apiService.get<{ data: unknown[]; meta?: ListMeta }>("api/v1/rooms", params);
    return { data: snakeizeKeys<RoomApiItem[]>(response.data.data), meta: response.data.meta };
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
