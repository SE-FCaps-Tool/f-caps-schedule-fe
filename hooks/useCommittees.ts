"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchCommittees,
  type CommitteeBatchRequest,
} from "@/lib/api/services/fetchCommittees";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import type { ApiError } from "@/types/api";

export function useCommittees(lecturerId?: string) {
  return useQuery({
    queryKey: adminKeys.committees(lecturerId),
    queryFn: async () => (await fetchCommittees.list(lecturerId)).data,
    staleTime: Infinity,
  });
}

/** POST /committees/preview — validate-only, không invalidate cache, gọi lại tự do khi gõ. */
export function usePreviewCommittees() {
  return useMutation({
    mutationFn: (payload: CommitteeBatchRequest) => fetchCommittees.preview(payload),
  });
}

export function useCreateCommittees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CommitteeBatchRequest) => fetchCommittees.createBatch(payload),
    onSuccess: async (data) => {
      if (data.created > 0) {
        await queryClient.invalidateQueries({ queryKey: ["admin", "committees"] });
        await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      }
      if (data.created > 0 && data.skipped === 0) {
        toast.success(`Đã tạo ${data.created} hội đồng`);
      } else if (data.created > 0) {
        toast.warning(`Đã tạo ${data.created} hội đồng, bỏ qua ${data.skipped} nhóm lỗi`);
      } else {
        toast.error("Không có hội đồng nào được tạo — kiểm tra lỗi bên dưới");
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không tạo được hội đồng");
    },
  });
}

export function useDeleteCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (committeeId: string) => fetchCommittees.remove(committeeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "committees"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success("Đã xoá hội đồng");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không xoá được hội đồng");
    },
  });
}

export function useBulkDeleteCommittees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (committeeIds: string[]) => fetchCommittees.bulkDelete(committeeIds),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "committees"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      toast.success(`Đã xoá ${data.deleted} hội đồng`);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không xoá được các hội đồng đã chọn");
    },
  });
}
