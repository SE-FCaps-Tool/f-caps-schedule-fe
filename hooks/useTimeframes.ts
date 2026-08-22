"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchTimeframes,
  type ManualTimeframeMutationRequest,
  type ManualTimeframePreviewRequest,
  type TimeframeMutationRequest,
  type TimeframePreviewRequest,
} from "@/lib/api/services/fetchTimeframes";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

const timeframeKeys = {
  all: ["timeframes"] as const,
  list: (includeArchived = false) => ["timeframes", "list", includeArchived] as const,
};

export function useTimeframes(includeArchived = false) {
  return useQuery({
    queryKey: timeframeKeys.list(includeArchived),
    queryFn: () => fetchTimeframes.list(includeArchived),
    select: (result) => result.data,
    staleTime: 30 * 1000,
  });
}

export function useTimeframe(id?: number | null) {
  return useQuery({
    queryKey: ["timeframes", "detail", id ?? null] as const,
    queryFn: () => fetchTimeframes.getById(id as number),
    enabled: id != null,
    staleTime: 30 * 1000,
  });
}

export function useTimeframePreview() {
  return useMutation({
    mutationFn: (payload: TimeframePreviewRequest) => fetchTimeframes.preview(payload),
  });
}

export function useManualTimeframePreview() {
  return useMutation({
    mutationFn: (payload: ManualTimeframePreviewRequest) =>
      fetchTimeframes.manualPreview(payload),
  });
}

export function useCreateTimeframe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TimeframeMutationRequest) => fetchTimeframes.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: timeframeKeys.all });
      toast.success(`Đã tạo timeframe “${data.name}”`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được timeframe"));
    },
  });
}

export function useCreateManualTimeframe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualTimeframeMutationRequest) =>
      fetchTimeframes.createManual(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: timeframeKeys.all });
      toast.success(`Đã tạo timeframe “${data.name}”`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được timeframe"));
    },
  });
}

export function useUpdateTimeframe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TimeframeMutationRequest }) =>
      fetchTimeframes.update(id, payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: timeframeKeys.all });
      toast.success(`Đã cập nhật timeframe “${data.name}”`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được timeframe"));
    },
  });
}

export function useUpdateManualTimeframe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ManualTimeframeMutationRequest;
    }) => fetchTimeframes.updateManual(id, payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: timeframeKeys.all });
      toast.success(`Đã cập nhật timeframe “${data.name}”`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được timeframe"));
    },
  });
}

export function useArchiveTimeframe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => fetchTimeframes.archive(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: timeframeKeys.all });
      toast.success("Đã lưu timeframe vào lịch sử");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không thể archive timeframe"));
    },
  });
}
