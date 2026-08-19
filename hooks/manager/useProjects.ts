"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchProjects,
  type ProjectCreatePayload,
  type ProjectListParams,
  type ProjectUpdatePayload,
} from "@/lib/api/services/fetchProjects";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /semesters/:semesterId/projects — spec §16/§46 */
export function useProjects(semesterId?: number | null, params?: ProjectListParams) {
  return useQuery({
    queryKey: [...managerKeys.projects(semesterId), params ?? null] as const,
    queryFn: () => fetchProjects.list(String(semesterId), params),
    enabled: semesterId != null,
    staleTime: 30 * 1000,
  });
}

/** POST /semesters/:semesterId/projects — spec §17/§47 */
export function useCreateProject(semesterId?: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => fetchProjects.create(String(semesterId), payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      toast.success(`Đã tạo đề tài ${data.code}`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được đề tài"));
    },
  });
}

/** PATCH /projects/:projectId — cập nhật GVHD của đề tài */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectUpdatePayload }) =>
      fetchProjects.update(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      toast.success("Đã cập nhật GVHD đề tài");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được GVHD"));
    },
  });
}

/** GET /projects/:projectId — spec §18 */
export function useProjectDetail(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId] as const,
    queryFn: () => fetchProjects.getById(projectId as string),
    enabled: projectId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /projects/:projectId/progression — spec §18/§75 */
export function useProjectProgression(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId, "progression"] as const,
    queryFn: () => fetchProjects.progression(projectId as string),
    enabled: projectId !== null,
    staleTime: 15 * 1000,
  });
}

/** GET /projects/:projectId/results — spec §18 */
export function useProjectResults(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId, "results"] as const,
    queryFn: () => fetchProjects.results(projectId as string),
    enabled: projectId !== null,
    staleTime: 15 * 1000,
  });
}
