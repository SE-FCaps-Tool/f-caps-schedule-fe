import type { RoomType } from "@/lib/api/services/fetchRounds";
import type { RoomStatus } from "@/lib/api/services/fetchRoomAssignment";

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  NORMAL: "Phòng thường",
  SEMINAR: "Seminar",
  LAB: "Lab",
};

export const ROOM_TYPES: RoomType[] = ["NORMAL", "SEMINAR", "LAB"];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  ACTIVE: "Đang dùng",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Ngừng dùng",
};
