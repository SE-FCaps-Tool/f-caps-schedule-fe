"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchConflicts, type ConflictCreatePayload } from "@/lib/api/services/fetchConflicts";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** POST /lecturers/{lecturer_id}/conflicts — khai báo xung đột lợi ích, dùng để loại Reviewer (H8) */
export function useCreateConflict() {
  return useMutation({
    mutationFn: ({ lecturerId, payload }: { lecturerId: number; payload: ConflictCreatePayload }) =>
      fetchConflicts.create(lecturerId, payload),
    onSuccess: () => {
      toast.success("Đã ghi nhận xung đột lợi ích");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không ghi nhận được xung đột lợi ích"));
    },
  });
}
