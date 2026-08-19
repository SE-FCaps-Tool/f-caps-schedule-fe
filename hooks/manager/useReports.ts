"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchReports } from "@/lib/api/services/fetchReports";
import { managerKeys } from "@/lib/api/managerQueryKeys";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

/** GET /dashboard?semester_id=&round_id= — semester_id bắt buộc theo manager-api.md §3 */
export function useDashboard(semesterId?: number | null, roundId?: number | null) {
  return useQuery({
    queryKey: managerKeys.dashboard(semesterId, roundId),
    queryFn: () => fetchReports.dashboard(semesterId, roundId),
    staleTime: 15 * 1000,
  });
}

/** GET /reports/lecturer-load?semester_id=&round_id= — semester_id bắt buộc theo manager-api.md §3 */
export function useLecturerLoadReport(semesterId?: number | null, roundId?: number | null) {
  return useQuery({
    queryKey: managerKeys.reportsLecturerLoad(semesterId, roundId),
    queryFn: () => fetchReports.lecturerLoad(semesterId, roundId),
    staleTime: 30 * 1000,
  });
}

/** GET /reports/unscheduled?round_id=&semester_id= — round_id bắt buộc */
export function useUnscheduledReport(roundId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.reportsUnscheduled(roundId ?? 0, semesterId),
    queryFn: () => fetchReports.unscheduled(roundId as number, semesterId),
    enabled: roundId !== null,
    staleTime: 30 * 1000,
  });
}

/** GET /reports/quality?semester_id= — semester_id bắt buộc theo manager-api.md §3 */
export function useQualityReport(semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.reportsQuality(semesterId),
    queryFn: () => fetchReports.quality(semesterId),
    staleTime: 30 * 1000,
  });
}

/** GET /reports/remediation?semester_id=&round_id= — semester_id bắt buộc theo manager-api.md §3 */
export function useRemediationReport(semesterId?: number | null, roundId?: number | null) {
  return useQuery({
    queryKey: managerKeys.reportsRemediation(semesterId, roundId),
    queryFn: () => fetchReports.remediation(semesterId, roundId),
    staleTime: 30 * 1000,
  });
}

/** GET /reports/outcomes?semester_id=&round_id= — semester_id bắt buộc theo manager-api.md §3 */
export function useOutcomesReport(semesterId?: number | null, roundId?: number | null) {
  return useQuery({
    queryKey: managerKeys.reportsOutcomes(semesterId, roundId),
    queryFn: () => fetchReports.outcomes(semesterId, roundId),
    staleTime: 30 * 1000,
  });
}

/** GET /reports/provenance/{version_id}?semester_id= */
export function useProvenance(versionId: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: managerKeys.provenance(versionId ?? 0, semesterId),
    queryFn: () => fetchReports.provenance(versionId as number, semesterId),
    enabled: versionId !== null,
    staleTime: 60 * 1000,
  });
}

/** GET /reports/group-progress?semester_id= — chưa có ở backend, xem docs/manager-api.md §8.6 */
export function useGroupProgress(semesterId?: number | null) {
  return useQuery({
    queryKey: ["manager", "reports", "group-progress", semesterId ?? null] as const,
    queryFn: () => fetchReports.groupProgress(semesterId),
    staleTime: 30 * 1000,
  });
}

/** GET /exports/semester/{semester_id}/schedule.xlsx — tải file trực tiếp, không có body phản hồi để cache */
export function useExportSchedule() {
  return useMutation({
    mutationFn: (semesterId: number) => fetchReports.exportSchedule(semesterId),
    onSuccess: () => toast.success("Đã tải xuống lịch đánh giá"),
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không xuất được lịch đánh giá")),
  });
}

/** GET /exports/semester/{semester_id}/results.xlsx — tải file trực tiếp, không có body phản hồi để cache */
export function useExportResults() {
  return useMutation({
    mutationFn: (semesterId: number) => fetchReports.exportResults(semesterId),
    onSuccess: () => toast.success("Đã tải xuống kết quả"),
    onError: (error: ApiError) => toast.error(friendlyErrorMessage(error, "Không xuất được kết quả")),
  });
}
