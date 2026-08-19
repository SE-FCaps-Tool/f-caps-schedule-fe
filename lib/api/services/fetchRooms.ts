import apiService from "../core";

export interface RoomApiItem {
  id: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
}

export interface RoomCreatePayload {
  code: string;
  name: string;
  capacity: number;
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
};
