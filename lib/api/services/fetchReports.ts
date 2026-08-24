import type { AxiosResponse } from "axios";
import apiService from "../core";

export interface DashboardResponse {
  /** manager-api.md §10.6 */
  totals: { projects: number; groups: number; students: number; lecturers: number };
  availability: { invited: number; responded: number };
  groups: { total: number; scheduled: number; unscheduled: number };
  pendingRescheduleRequests: number;
  changes: number;
  version:
    | {
        versionId: number;
        roundId: number;
        status: string;
        createdAt: string;
        type: string;
        semesterId: number;
        semesterCode: string;
        generatedAt: string;
      }
    | null;
  lecturerLoad: { id: number; lecturerCode: string; displayName: string; sessionCount: number }[];
  attentionGroups: { id: number; code: string; status: string }[];
  /** manager-api.md §10.6 */
  attention: { noLeader: number; underFour: number; remediationOverdue: number; unscheduled: number };
  /** CHƯA CÓ Ở BACKEND, đề xuất tại manager-api.md §8.7 — số phiên có sự cố GV báo vắng chưa xử lý xong */
  pendingReplacements?: number;
}

export interface GroupProgressRow {
  groupId: number;
  groupCode: string;
  projectName: string;
  review1: string | null;
  review2: string | null;
  review3: string | null;
  defense1: string | null;
  groupStatus: string;
  nextStep: string;
}

export interface LecturerLoadReportResponse {
  roundId: number | null;
  version: { versionId: number; roundId: number; status: string } | null;
  rows: {
    lecturerId: number;
    lecturerCode: string;
    displayName: string;
    sessionCount: number;
    quota: number;
    quotaPercent: number;
  }[];
}

export interface UnscheduledReportResponse {
  roundId: number;
  generatedAt: string;
  versions: {
    versionId: number;
    versionNo: number;
    status: string;
    createdAt: string;
    unscheduled: unknown[];
    provenance: unknown;
  }[];
}

export interface QualityReportResponse {
  version: { versionId: number; roundId: number; status: string } | null;
  rows: { id: number; code: string; activeMembers: number; leaders: number }[];
}

export interface RemediationReportResponse {
  roundId: number | null;
  version: { versionId: number; roundId: number; status: string } | null;
  rows: { id: number; groupId: number; groupCode: string; dueAt: string; status: string; verifierLecturerId: number | null }[];
}

export interface OutcomesReportResponse {
  roundId: number | null;
  version: { versionId: number; roundId: number; status: string } | null;
  rows: { type: string; outcome: string; count: number }[];
}

export interface ProvenanceResponse {
  versionId: number;
  versionNo: number;
  status: string;
  createdAt: string;
  roundId: number;
  type: string;
  semesterCode: string;
  generatedAt: string;
}

export const fetchReports = {
  /** GET /dashboard?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3/§10.6, round_id optional */
  dashboard: async (semesterId?: number | null, roundId?: number | null): Promise<DashboardResponse> => {
    const response = await apiService.get<DashboardResponse, { semesterId?: number; roundId?: number }>(
      "api/v1/dashboard",
      { semesterId: semesterId ?? undefined, roundId: roundId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/lecturer-load?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  lecturerLoad: async (
    semesterId?: number | null,
    roundId?: number | null
  ): Promise<LecturerLoadReportResponse> => {
    const response = await apiService.get<LecturerLoadReportResponse, { semesterId?: number; roundId?: number }>(
      "api/v1/reports/lecturer-load",
      { semesterId: semesterId ?? undefined, roundId: roundId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/unscheduled?semester_id=&round_id= — ADMIN, MANAGER. round_id bắt buộc, semester_id theo checklist §9 */
  unscheduled: async (roundId: number, semesterId?: number | null): Promise<UnscheduledReportResponse> => {
    const response = await apiService.get<UnscheduledReportResponse, { roundId: number; semesterId?: number }>(
      "api/v1/reports/unscheduled",
      { roundId, semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/quality?semester_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  quality: async (semesterId?: number | null): Promise<QualityReportResponse> => {
    const response = await apiService.get<QualityReportResponse, { semesterId?: number }>(
      "api/v1/reports/quality",
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/remediation?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  remediation: async (
    semesterId?: number | null,
    roundId?: number | null
  ): Promise<RemediationReportResponse> => {
    const response = await apiService.get<RemediationReportResponse, { semesterId?: number; roundId?: number }>(
      "api/v1/reports/remediation",
      { semesterId: semesterId ?? undefined, roundId: roundId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/outcomes?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  outcomes: async (semesterId?: number | null, roundId?: number | null): Promise<OutcomesReportResponse> => {
    const response = await apiService.get<OutcomesReportResponse, { semesterId?: number; roundId?: number }>(
      "api/v1/reports/outcomes",
      { semesterId: semesterId ?? undefined, roundId: roundId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/provenance/{version_id}?semester_id= — tất cả role, Manager luôn trong scope */
  provenance: async (versionId: number, semesterId?: number | null): Promise<ProvenanceResponse> => {
    const response = await apiService.get<ProvenanceResponse, { semesterId?: number }>(
      `api/v1/reports/provenance/${versionId}`,
      { semesterId: semesterId ?? undefined }
    );
    return response.data;
  },

  /** GET /reports/group-progress?semester_id= — CHƯA CÓ Ở BACKEND, đề xuất tại manager-api.md §8.6 */
  /**
   * BE có thể trả mảng phẳng HOẶC `{data: [...], meta}` qua success_payload() tuỳ đã migrate
   * hay chưa (xem docs/be-checklist-open-questions.md mục 6) — chấp nhận cả 2 dạng cho an toàn.
   */
  groupProgress: async (semesterId?: number | null): Promise<GroupProgressRow[]> => {
    const response = await apiService.get<unknown, { semesterId?: number }>("api/v1/reports/group-progress", {
      semesterId: semesterId ?? undefined,
    });
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: unknown[] }).data
        : [];
    return list as GroupProgressRow[];
  },

  /**
   * GET /exports/semester/{semester_id}/schedule.xlsx — ADMIN, MANAGER. manager-api.md §3/§10.8.
   * Trả binary .xlsx với Content-Disposition: attachment; tự trigger tải file trên browser.
   */
  exportSchedule: async (semesterId: number): Promise<void> => {
    const response = await apiService.download(`api/v1/exports/semester/${semesterId}/schedule.xlsx`);
    downloadBlob(response, `semester-${semesterId}-schedule.xlsx`);
  },

  /** GET /exports/semester/{semester_id}/results.xlsx — ADMIN, MANAGER. manager-api.md §3/§10.8 */
  exportResults: async (semesterId: number): Promise<void> => {
    const response = await apiService.download(`api/v1/exports/semester/${semesterId}/results.xlsx`);
    downloadBlob(response, `semester-${semesterId}-results.xlsx`);
  },
};

function downloadBlob(response: AxiosResponse<Blob>, fallbackFilename: string) {
  const disposition = String((response.headers as Record<string, unknown>)["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || fallbackFilename;
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
