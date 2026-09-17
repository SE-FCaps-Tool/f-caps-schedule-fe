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
import { useInfiniteScroll } from "@/hooks/shared/useInfiniteScroll";
import type { ApiError } from "@/types/api";

/** GET /semesters/:semesterId/projects — spec §16/§46 */
export function useProjects(semesterId?: number | null, params?: ProjectListParams) {
  return useQuery({
    queryKey: [...managerKeys.projects(semesterId), params ?? null] as const,
    queryFn: () => fetchProjects.list(String(semesterId), params),
    enabled: semesterId != null,
    staleTime: Infinity,
  });
}

/**
 * GET /semesters/:semesterId/projects, load-more theo scroll + search phía server — dùng cho
 * AsyncCombobox trong dialog gắn đề tài. Search đi thẳng xuống BE nên tìm được mã đề tài ở
 * mọi trang, không chỉ trang đã tải.
 */
export function useProjectsInfinite(
  semesterId?: number | null,
  params?: Omit<ProjectListParams, "page" | "pageSize">
) {
  return useInfiniteScroll({
    queryKey: ["manager", "projects", "infinite", semesterId ?? null, params ?? null] as const,
    queryFn: ({ page, pageSize }) => fetchProjects.list(String(semesterId), { ...params, page, pageSize }),
    pageSize: 20,
    enabled: semesterId != null,
  });
}

/** POST /semesters/:semesterId/projects — spec §17/§47 */
export function useCreateProject(semesterId?: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => fetchProjects.create(String(semesterId), payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
      toast.success(`Đã tạo đề tài ${data.code}`);
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không tạo được đề tài"));
    },
  });
}

/** PATCH /projects/:projectId — cập nhật metadata/GVHD của đề tài */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectUpdatePayload }) =>
      fetchProjects.update(projectId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "project", variables.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
      toast.success("Đã cập nhật đề tài");
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Không cập nhật được đề tài"));
    },
  });
}

/** GET /projects/:projectId — spec §18 */
export function useProjectDetail(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId] as const,
    queryFn: () => fetchProjects.getById(projectId as string),
    enabled: projectId !== null,
    staleTime: Infinity,
  });
}

/** GET /projects/:projectId/progression — spec §18/§75 */
export function useProjectProgression(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId, "progression"] as const,
    queryFn: () => fetchProjects.progression(projectId as string),
    enabled: projectId !== null,
    staleTime: Infinity,
  });
}

/** GET /projects/:projectId/results — spec §18 */
export function useProjectResults(projectId: string | null) {
  return useQuery({
    queryKey: ["manager", "project", projectId, "results"] as const,
    queryFn: () => fetchProjects.results(projectId as string),
    enabled: projectId !== null,
    staleTime: Infinity,
  });
}

/** POST /projects/import?semesterId= — Import danh sách đề tài từ file Excel */
export function useImportProjects(semesterId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      if (!semesterId) throw new Error("Chưa chọn học kỳ");
      return fetchProjects.importFile(file, semesterId);
    },
    onSuccess: async (data) => {
      const affected = data.created + data.updated;
      if (affected > 0) {
        await queryClient.invalidateQueries({ queryKey: ["manager", "projects"] });
        await queryClient.invalidateQueries({ queryKey: ["manager", "dashboard"] });
      }
      if ((data.membersAssigned ?? 0) > 0) {
        await queryClient.invalidateQueries({ queryKey: ["manager", "groups"] });
      }
      if (affected > 0 && data.skipped === 0) {
        toast.success(`Đã tạo ${data.created}, cập nhật ${data.updated} đề tài`);
      } else if (affected > 0) {
        toast.warning(`Đã tạo ${data.created}, cập nhật ${data.updated} đề tài, bỏ qua ${data.skipped} dòng lỗi`);
      } else {
        toast.error("Không có đề tài nào được import — vui lòng kiểm tra danh sách lỗi");
      }
    },
    onError: (error: ApiError) => {
      toast.error(friendlyErrorMessage(error, "Import đề tài thất bại"));
    },
  });
}
