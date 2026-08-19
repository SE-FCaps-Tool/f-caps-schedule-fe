"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchProjects, type ProjectCreatePayload, type ProjectUpdatePayload } from "@/lib/api/services/fetchProjects";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { detailCode, friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /projects?semester_id= (xem docs/manager-api.md §3/§8) */
export function useProjects(semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.projects(semesterId),
    queryFn: () => fetchProjects.list(semesterId),
    staleTime: 30 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => fetchProjects.create(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      toast.success(`Đã tạo đề tài ${data.code}`);
    },
    onError: (error: ApiError) => {
      if (error.code === 409 && detailCode(error) === undefined) {
        toast.error("Mã đề tài đã tồn tại trong học kỳ này");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không tạo được đề tài"));
    },
  });
}

/** PATCH /projects/{project_id}?semester_id= — manager-api.md §5/§10.3 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
      semesterId,
    }: {
      projectId: number;
      payload: ProjectUpdatePayload;
      semesterId?: number | null;
    }) => fetchProjects.update(projectId, payload, semesterId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      toast.success("Đã cập nhật đề tài");
    },
    onError: (error: ApiError) => {
      if (error.code === 409 && detailCode(error) === undefined) {
        toast.error("Mã đề tài đã tồn tại trong học kỳ này");
        return;
      }
      toast.error(friendlyErrorMessage(error, "Không cập nhật được đề tài"));
    },
  });
}
