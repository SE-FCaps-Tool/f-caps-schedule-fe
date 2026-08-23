"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchRoomAssignment,
  type AssignableRoom,
  type AssignRoomPayload,
  type AvailableRoomsParams,
  type RoomSuggestion,
} from "@/lib/api/services/fetchRoomAssignment";
import { fetchRooms, type RoomApiItem } from "@/lib/api/services/fetchRooms";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

const ROOM_CATALOG_PAGE_SIZE = 200;

function adaptCatalogRoom(room: RoomApiItem): AssignableRoom {
  return {
    id: String(room.id),
    code: room.code,
    type: room.type ?? "NORMAL",
    status: room.status ?? "ACTIVE",
  };
}

async function fetchRoomCatalog() {
  const rooms: AssignableRoom[] = [];
  let page = 1;

  while (true) {
    const response = await fetchRooms.list({ page, pageSize: ROOM_CATALOG_PAGE_SIZE });
    rooms.push(...response.data.map(adaptCatalogRoom));

    if (!response.meta || response.data.length === 0 || rooms.length >= response.meta.total) {
      return rooms;
    }
    page += 1;
  }
}

/** GET /rounds/:roundId/sessions?versionId= — spec §27 */
export function useRoundSessions(roundId: string | null, versionId: string | null) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "sessions", versionId] as const,
    queryFn: () => fetchRoomAssignment.sessions(roundId as string, versionId as string),
    enabled: roundId !== null && versionId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /rounds/:roundId/rooms/available — spec §28/§65 */
export function useAvailableRooms(roundId: string | null, params?: AvailableRoomsParams) {
  return useQuery({
    queryKey: ["manager", "round", roundId, "rooms-available", params ?? null] as const,
    queryFn: () => fetchRoomAssignment.availableRooms(roundId as string, params),
    enabled: roundId !== null,
    staleTime: 15 * 1000,
  });
}

/** Room catalog cho lịch PUBLISHED; không mang ngữ nghĩa availability của version ACTIVE. */
export function useRoomCatalog(enabled: boolean) {
  return useQuery({
    queryKey: ["manager", "rooms", "catalog"] as const,
    queryFn: fetchRoomCatalog,
    enabled,
    staleTime: 30 * 1000,
  });
}

function useInvalidateRoomAssignment() {
  const queryClient = useQueryClient();
  return async (roundId: string) => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId, "sessions"] });
    await queryClient.invalidateQueries({ queryKey: ["manager", "round", roundId, "rooms-available"] });
  };
}

/** PUT /sessions/:sessionId/room — spec §28/§66 */
export function useAssignRoom(roundId: string) {
  const invalidate = useInvalidateRoomAssignment();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: AssignRoomPayload }) =>
      fetchRoomAssignment.assignRoom(sessionId, payload),
    onSuccess: async () => {
      await invalidate(roundId);
      toast.success("Đã gán phòng");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gán được phòng — kiểm tra xung đột cùng timeslot"));
    },
  });
}

/** POST /rounds/:roundId/rooms/suggest — spec §28/§67 */
export function useSuggestRooms() {
  return useMutation({
    mutationFn: (roundId: string) => fetchRoomAssignment.suggestRooms(roundId),
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tính được gợi ý gán phòng"));
    },
  });
}

/** POST /rounds/:roundId/rooms/apply-suggestions — spec §28/§68 */
export function useApplySuggestions(roundId: string) {
  const invalidate = useInvalidateRoomAssignment();

  return useMutation({
    mutationFn: (suggestions: RoomSuggestion[]) => fetchRoomAssignment.applySuggestions(roundId, suggestions),
    onSuccess: async () => {
      await invalidate(roundId);
      toast.success("Đã áp dụng gợi ý gán phòng");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không áp dụng được gợi ý — thử tính lại"));
    },
  });
}
