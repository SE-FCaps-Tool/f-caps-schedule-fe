"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchGroups,
  type DropMemberPayload,
  type GroupCreatePayload,
  type SetLeaderPayload,
} from "@/lib/api/services/fetchGroups";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { detailCode, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /groups?semester_id= (xem docs/manager-api.md §3/§8) */
export function useGroups(semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.groups(semesterId),
    queryFn: () => fetchGroups.list(semesterId),
    staleTime: 30 * 1000,
  });
}

/** GET /groups/{group_id}?semester_id= — nguồn danh sách thành viên cho picker Leader/Rời nhóm */
export function useGroupDetail(groupId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: ["manager", "group", groupId ?? 0, semesterId ?? null] as const,
    queryFn: () => fetchGroups.getById(groupId as number, semesterId),
    enabled: groupId !== null,
    staleTime: 15 * 1000,
  });
}

function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return async (groupId?: number) => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "groups"] });
    if (groupId) await queryClient.invalidateQueries({ queryKey: ["manager", "group", groupId] });
  };
}

export function useCreateGroup() {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (payload: GroupCreatePayload) => fetchGroups.create(payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo nhóm ${data.code} (${data.member_count} thành viên)`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409 && detailCode(error) === undefined) {
        toast.error("Nhóm hoặc thành viên đã tồn tại");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không tạo được nhóm"));
    },
  });
}

export function useDropGroupMember() {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: ({
      groupId,
      studentId,
      payload,
    }: {
      groupId: number;
      studentId: number;
      payload: DropMemberPayload;
    }) => fetchGroups.dropMember(groupId, studentId, payload),
    onSuccess: async (data, variables) => {
      await invalidate(variables.groupId);
      toast.success(
        data.warning === "GROUP_BELOW_MINIMUM_MAY_CONTINUE"
          ? "Đã đánh dấu rời nhóm — nhóm dưới sĩ số tối thiểu nhưng vẫn tiếp tục được (BR-STU-03)"
          : "Đã đánh dấu sinh viên rời nhóm"
      );
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được thành viên"));
    },
  });
}

export function useSetGroupLeader() {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: SetLeaderPayload }) =>
      fetchGroups.setLeader(groupId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.groupId);
      toast.success("Đã cập nhật trưởng nhóm");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đổi được trưởng nhóm"));
    },
  });
}
