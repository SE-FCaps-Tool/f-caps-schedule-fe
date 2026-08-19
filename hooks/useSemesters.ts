"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchSemesters,
  type SemesterCreatePayload,
  type SemesterTransitionPayload,
} from "@/lib/api/services/fetchSemesters";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import { detailCode, detailMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

export function useSemesters() {
  return useQuery({
    queryKey: adminKeys.semesters,
    queryFn: fetchSemesters.list,
    staleTime: 30 * 1000,
  });
}

export function useCreateSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SemesterCreatePayload) => fetchSemesters.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.semesters });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(`Đã tạo học kỳ ${data.code} (UPCOMING)`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Mã học kỳ đã tồn tại");
        return;
      }
      if (error.code === 422 && detailCode(error) === "SEMESTER_DURATION_INVALID") {
        toast.error(detailMessage(error) || "Thời lượng học kỳ phải từ 105 đến 120 ngày");
        return;
      }
      toast.error(error.message || "Không tạo được học kỳ");
    },
  });
}

export function useTransitionSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SemesterTransitionPayload }) =>
      fetchSemesters.transition(id, payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.semesters });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(
        data.status === "ACTIVE" ? "Đã mở học kỳ" : data.status === "CLOSED" ? "Đã đóng học kỳ" : "Đã cập nhật trạng thái học kỳ"
      );
    },
    onError: (error: ApiError) => {
      if (error.code === 403) {
        toast.error("Chỉ ADMIN/MANAGER được chuyển trạng thái học kỳ");
        return;
      }
      if (error.code === 409) {
        toast.error("Đã có học kỳ ACTIVE — chỉ được 1 học kỳ ACTIVE cùng lúc");
        return;
      }
      if (error.code === 422) {
        toast.error(detailMessage(error) || "Không thể chuyển sang trạng thái này");
        return;
      }
      toast.error(error.message || "Không chuyển được trạng thái học kỳ");
    },
  });
}
