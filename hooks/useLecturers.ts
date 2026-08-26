"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchLecturers,
  type LecturerCreatePayload,
  type LecturerListParams,
  type LecturerUpdatePayload,
} from "@/lib/api/services/fetchLecturers";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import type { ApiError } from "@/types/api";

/**
 * Danh sách phẳng cho combobox/select chọn giảng viên (không có UI phân trang) — cần cả
 * "roster" để lọc tại chỗ. BE mặc định pageSize=20 nếu không truyền, nên vẫn phải xin đủ.
 */
const ROSTER_PAGE_SIZE = 200;

export function useLecturers(params?: LecturerListParams) {
  const effectiveParams = { pageSize: ROSTER_PAGE_SIZE, ...params };
  return useQuery({
    queryKey: [...adminKeys.lecturers, params ?? null] as const,
    queryFn: async () => (await fetchLecturers.list(effectiveParams)).data,
    staleTime: Infinity,
  });
}

/**
 * Dùng cho bảng có UI phân trang thật (lecturers-page.tsx) — trả nguyên `{data, meta}` từ BE,
 * page/pageSize/search đi thẳng vào request, không tự fetch-rồi-cắt phía client.
 */
export function useLecturersPage(params: LecturerListParams) {
  return useQuery({
    queryKey: [...adminKeys.lecturers, "page", params] as const,
    queryFn: () => fetchLecturers.list(params),
    staleTime: Infinity,
  });
}

export function useCreateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LecturerCreatePayload) => fetchLecturers.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.lecturers });
      await queryClient.invalidateQueries({ queryKey: ["manager", "lecturers"] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.accounts });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(`Đã thêm giảng viên ${data.lecturerCode}`);
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

export function useUpdateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lecturerId, payload }: { lecturerId: number; payload: LecturerUpdatePayload }) =>
      fetchLecturers.update(lecturerId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.lecturers });
      await queryClient.invalidateQueries({ queryKey: ["manager", "lecturers"] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.accounts });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success("Đã cập nhật mức độ kinh nghiệm giảng viên");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không cập nhật được mức độ kinh nghiệm");
    },
  });
}

export function useImportLecturers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => fetchLecturers.importFile(file),
    onSuccess: async (data) => {
      if (data.created > 0) {
        await queryClient.invalidateQueries({ queryKey: adminKeys.lecturers });
        await queryClient.invalidateQueries({ queryKey: ["manager", "lecturers"] });
        await queryClient.invalidateQueries({ queryKey: adminKeys.accounts });
        await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      }
      if (data.created > 0 && data.skipped === 0) {
        toast.success(`Đã import ${data.created} giảng viên`);
      } else if (data.created > 0) {
        toast.warning(`Đã tạo ${data.created} giảng viên, bỏ qua ${data.skipped} dòng lỗi`);
      } else {
        toast.error("Không có giảng viên nào được tạo — kiểm tra danh sách lỗi bên dưới");
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Import thất bại");
    },
  });
}
