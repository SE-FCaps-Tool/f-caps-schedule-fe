"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchSemesters,
  type SemesterCreatePayload,
  type SemesterListParams,
  type SemesterTransitionPayload,
  type SemesterUpdatePayload,
} from "@/lib/api/services/fetchSemesters";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import { detailCode, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

function useInvalidateSemesters() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "semesters"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "semester"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
  };
}

export function useSemesters(params?: SemesterListParams) {
  return useQuery({
    queryKey: adminKeys.semesters(params),
    queryFn: async () => (await fetchSemesters.list(params)).data,
    staleTime: Infinity,
  });
}

export function useSemester(id: number | null) {
  return useQuery({
    queryKey: adminKeys.semester(id ?? 0),
    queryFn: () => fetchSemesters.getById(id as number),
    enabled: id !== null,
    staleTime: Infinity,
  });
}

export function useCreateSemester() {
  const invalidate = useInvalidateSemesters();

  return useMutation({
    mutationFn: (payload: SemesterCreatePayload) => fetchSemesters.create(payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo học kỳ ${data.code} (ACTIVE)`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409 && detailCode(error) === "ACTIVE_SEMESTER_EXISTS") {
        toast.error("Đã có học kỳ ACTIVE — đóng học kỳ hiện tại trước khi tạo học kỳ mới");
        return;
      }
      if (error.code === 409) {
        toast.error("Mã học kỳ đã tồn tại");
        return;
      }
      if (error.code === 422 && detailCode(error) === "SEMESTER_DURATION_INVALID") {
        toast.error(friendlyErrorMessage(error, "Thời lượng học kỳ phải từ 105 đến 120 ngày"));
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không tạo được học kỳ"));
    },
  });
}

export function useUpdateSemester() {
  const invalidate = useInvalidateSemesters();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SemesterUpdatePayload }) => fetchSemesters.update(id, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã cập nhật học kỳ");
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Mã học kỳ đã tồn tại");
        return;
      }
      if (error.code === 422 && detailCode(error) === "SEMESTER_DURATION_INVALID") {
        toast.error(friendlyErrorMessage(error, "Thời lượng học kỳ phải từ 105 đến 120 ngày"));
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không cập nhật được học kỳ"));
    },
  });
}

export function useTransitionSemester() {
  const invalidate = useInvalidateSemesters();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SemesterTransitionPayload }) =>
      fetchSemesters.transition(id, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã đóng học kỳ");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đóng được học kỳ"));
    },
  });
}

/** POST /semesters/{id}/set-current — mở học kỳ CLOSED, tự đóng học kỳ ACTIVE hiện tại */
export function useSetCurrentSemester() {
  const invalidate = useInvalidateSemesters();

  return useMutation({
    mutationFn: (id: number) => fetchSemesters.setCurrent(id),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã đặt ${data.code} làm học kỳ hiện tại`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đặt được học kỳ hiện tại"));
    },
  });
}
