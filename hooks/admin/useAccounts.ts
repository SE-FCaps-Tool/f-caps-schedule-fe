"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAccounts,
  type AccountCreatePayload,
  type AccountRolePayload,
  type AccountStatusPayload,
} from "@/lib/api/services/fetchAccounts";
import { adminKeys } from "@/lib/api/adminQueryKeys";
import type { UserRole } from "@/lib/types/roles";
import type { ApiError } from "@/types/api";

export function useAccounts() {
  return useQuery({
    queryKey: adminKeys.accounts,
    queryFn: fetchAccounts.list,
    staleTime: 30 * 1000,
  });
}

function useInvalidateAfterAccountChange() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.accounts });
    await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
  };
}

export function useCreateAccount() {
  const invalidate = useInvalidateAfterAccountChange();

  return useMutation({
    mutationFn: (payload: AccountCreatePayload) => fetchAccounts.create(payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo tài khoản ${data.display_name}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409) {
        toast.error("Email đã tồn tại");
        return;
      }
      toast.error(error.message || "Không tạo được tài khoản");
    },
  });
}

export function useUpdateAccountStatus() {
  const invalidate = useInvalidateAfterAccountChange();

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: AccountStatusPayload }) =>
      fetchAccounts.updateStatus(accountId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Đã cập nhật trạng thái tài khoản");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không cập nhật được trạng thái");
    },
  });
}

export function useAssignRole() {
  const invalidate = useInvalidateAfterAccountChange();

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: AccountRolePayload }) =>
      fetchAccounts.assignRole(accountId, payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã gán vai trò ${data.role}`);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không gán được vai trò");
    },
  });
}

export function useRemoveRole() {
  const invalidate = useInvalidateAfterAccountChange();

  return useMutation({
    mutationFn: ({ accountId, role, reason }: { accountId: number; role: UserRole; reason: string }) =>
      fetchAccounts.removeRole(accountId, role, reason),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã gỡ vai trò ${data.role}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 422) {
        toast.error("Không thể gỡ vai trò cuối cùng của tài khoản");
        return;
      }
      toast.error(error.message || "Không gỡ được vai trò");
    },
  });
}
