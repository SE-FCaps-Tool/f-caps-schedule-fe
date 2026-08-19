"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRooms, type RoomCreatePayload } from "@/lib/api/services/fetchRooms";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import type { ApiError } from "@/types/api";

export function useRooms() {
  return useQuery({
    queryKey: adminKeys.rooms,
    queryFn: fetchRooms.list,
    staleTime: 30 * 1000,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RoomCreatePayload) => fetchRooms.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.rooms });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(`Đã thêm phòng ${data.code}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Mã phòng đã tồn tại");
        return;
      }
      toast.error(error.message || "Không thêm được phòng");
    },
  });
}
