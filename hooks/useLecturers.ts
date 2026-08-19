"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchLecturers, type LecturerCreatePayload } from "@/lib/api/services/fetchLecturers";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import type { ApiError } from "@/types/api";

export function useLecturers() {
  return useQuery({
    queryKey: adminKeys.lecturers,
    queryFn: fetchLecturers.list,
    staleTime: 30 * 1000,
  });
}

export function useCreateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LecturerCreatePayload) => fetchLecturers.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.lecturers });
      await queryClient.invalidateQueries({ queryKey: adminKeys.accounts });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(`Đã thêm giảng viên ${data.lecturer_code}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Email hoặc mã giảng viên đã tồn tại");
        return;
      }
      toast.error(error.message || "Không thêm được giảng viên");
    },
  });
}
