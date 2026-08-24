"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchGroups,
  type AssignProjectPayload,
  type ChangeLeaderPayload,
  type GroupCreatePayload,
  type GroupListItem,
  type GroupListParams,
  type MemberLeavePayload,
} from "@/lib/api/services/fetchGroups";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

const GROUP_LOOKUP_PAGE_SIZE = 200;

async function fetchAllGroups(semesterId: string) {
  const groups: GroupListItem[] = [];
  let page = 1;

  while (true) {
    const response = await fetchGroups.list(semesterId, {
      page,
      pageSize: GROUP_LOOKUP_PAGE_SIZE,
    });
    groups.push(...response.data);

    if (!response.meta || response.data.length === 0 || groups.length >= response.meta.total) {
      return groups;
    }
    page += 1;
  }
}

/** GET /semesters/:semesterId/groups — spec §11/§41 */
export function useGroups(semesterId?: number | null, params?: GroupListParams) {
  return useQuery({
    queryKey: [...managerKeys.groups(semesterId), params ?? null] as const,
    queryFn: () => fetchGroups.list(String(semesterId), params),
    enabled: semesterId != null,
    staleTime: Infinity,
  });
}

/** Lookup metadata cho toàn bộ nhóm của học kỳ, tải tuần tự theo giới hạn phân trang của BE. */
export function useAllGroups(semesterId?: string | null) {
  return useQuery({
    queryKey: [...managerKeys.groups(semesterId ? Number(semesterId) : null), "all"] as const,
    queryFn: () => fetchAllGroups(semesterId as string),
    enabled: semesterId != null,
    staleTime: Infinity,
  });
}

/** GET /groups/:groupId — spec §13, dùng cho overview + picker Leader/Rời nhóm qua members() */
export function useGroupDetail(groupId: string | null) {
  return useQuery({
    queryKey: ["manager", "group", groupId] as const,
    queryFn: () => fetchGroups.getById(groupId as string),
    enabled: groupId !== null,
    staleTime: Infinity,
  });
}

export function useGroupOverview(groupId: string | null) {
  return useQuery({
    queryKey: managerKeys.groupOverview(groupId ?? ""),
    queryFn: () => fetchGroups.overview(groupId as string),
    enabled: groupId !== null,
    staleTime: 30 * 1000,
  });
}

/** GET /groups/:groupId/members — spec §14 */
export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: ["manager", "group", groupId, "members"] as const,
    queryFn: () => fetchGroups.members(groupId as string),
    enabled: groupId !== null,
    staleTime: Infinity,
  });
}

function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return async (groupId?: string) => {
    await queryClient.invalidateQueries({ queryKey: ["manager", "groups"] });
    if (groupId) {
      await queryClient.invalidateQueries({ queryKey: ["manager", "group", groupId] });
      await queryClient.invalidateQueries({ queryKey: managerKeys.groupOverview(groupId) });
    }
    await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
  };
}

export function useCreateGroup(semesterId?: number | null) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (payload: GroupCreatePayload) => fetchGroups.create(String(semesterId), payload),
    onSuccess: async (data) => {
      await invalidate();
      toast.success(`Đã tạo nhóm ${data.code}`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được nhóm"));
    },
  });
}

export function useChangeGroupLeader() {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: ChangeLeaderPayload }) =>
      fetchGroups.changeLeader(groupId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.groupId);
      toast.success("Đã cập nhật trưởng nhóm");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không đổi được trưởng nhóm"));
    },
  });
}

export function useGroupMemberLeave() {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: ({
      groupId,
      membershipId,
      payload,
    }: {
      groupId: string;
      membershipId: string;
      payload: MemberLeavePayload;
    }) => fetchGroups.memberLeave(groupId, membershipId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.groupId);
      toast.success("Đã đánh dấu sinh viên rời nhóm");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được thành viên"));
    },
  });
}

export function useAssignGroupProject() {
  const invalidate = useInvalidateGroups();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: AssignProjectPayload }) =>
      fetchGroups.assignProject(groupId, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.groupId);
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      toast.success("Đã gắn đề tài cho nhóm");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không gắn được đề tài"));
    },
  });
}
