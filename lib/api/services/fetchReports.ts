import type { AxiosResponse } from "axios";
import apiService from "../core";
import { snakeizeKeys } from "../caseConvert";

export interface DashboardResponse {
  /** manager-api.md §10.6 */
  totals: { projects: number; groups: number; students: number; lecturers: number };
  availability: { invited: number; responded: number };
  groups: { total: number; scheduled: number; unscheduled: number };
  pending_reschedule_requests: number;
  changes: number;
  version:
    | {
        version_id: number;
        round_id: number;
        status: string;
        created_at: string;
        type: string;
        semester_id: number;
        semester_code: string;
        generated_at: string;
      }
    | null;
  lecturer_load: { id: number; lecturer_code: string; display_name: string; session_count: number }[];
  attention_groups: { id: number; code: string; status: string }[];
  /** manager-api.md §10.6 */
  attention: { no_leader: number; under_four: number; remediation_overdue: number; unscheduled: number };
  /** CHƯA CÓ Ở BACKEND, đề xuất tại manager-api.md §8.7 — số phiên có sự cố GV báo vắng chưa xử lý xong */
  pending_replacements?: number;
}

export interface GroupProgressRow {
  group_id: number;
  group_code: string;
  project_name: string;
  review_1: string | null;
  review_2: string | null;
  defense_1_1: string | null;
  group_status: string;
  next_step: string;
}

export interface LecturerLoadReportResponse {
  round_id: number | null;
  version: { version_id: number; round_id: number; status: string } | null;
  rows: {
    lecturer_id: number;
    lecturer_code: string;
    display_name: string;
    session_count: number;
    quota: number;
    quota_percent: number;
  }[];
}

export interface UnscheduledReportResponse {
  round_id: number;
  generated_at: string;
  versions: {
    version_id: number;
    version_no: number;
    status: string;
    created_at: string;
    unscheduled: unknown[];
    provenance: unknown;
  }[];
}

export interface QualityReportResponse {
  version: { version_id: number; round_id: number; status: string } | null;
  rows: { id: number; code: string; active_members: number; leaders: number }[];
}

export interface RemediationReportResponse {
  round_id: number | null;
  version: { version_id: number; round_id: number; status: string } | null;
  rows: { id: number; group_id: number; group_code: string; due_at: string; status: string; verifier_lecturer_id: number | null }[];
}

export interface OutcomesReportResponse {
  round_id: number | null;
  version: { version_id: number; round_id: number; status: string } | null;
  rows: { type: string; outcome: string; count: number }[];
}

export interface ProvenanceResponse {
  version_id: number;
  version_no: number;
  status: string;
  created_at: string;
  round_id: number;
  type: string;
  semester_code: string;
  generated_at: string;
}

export const fetchReports = {
  /** GET /dashboard?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3/§10.6, round_id optional */
  dashboard: async (semesterId?: number | null, roundId?: number | null): Promise<DashboardResponse> => {
    const response = await apiService.get<DashboardResponse>("api/v1/dashboard", {
      semester_id: semesterId ?? undefined,
      round_id: roundId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/lecturer-load?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  lecturerLoad: async (
    semesterId?: number | null,
    roundId?: number | null
  ): Promise<LecturerLoadReportResponse> => {
    const response = await apiService.get<LecturerLoadReportResponse>("api/v1/reports/lecturer-load", {
      semester_id: semesterId ?? undefined,
      round_id: roundId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/unscheduled?semester_id=&round_id= — ADMIN, MANAGER. round_id bắt buộc, semester_id theo checklist §9 */
  unscheduled: async (roundId: number, semesterId?: number | null): Promise<UnscheduledReportResponse> => {
    const response = await apiService.get<UnscheduledReportResponse>("api/v1/reports/unscheduled", {
      round_id: roundId,
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/quality?semester_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  quality: async (semesterId?: number | null): Promise<QualityReportResponse> => {
    const response = await apiService.get<QualityReportResponse>("api/v1/reports/quality", {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/remediation?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  remediation: async (
    semesterId?: number | null,
    roundId?: number | null
  ): Promise<RemediationReportResponse> => {
    const response = await apiService.get<RemediationReportResponse>("api/v1/reports/remediation", {
      semester_id: semesterId ?? undefined,
      round_id: roundId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/outcomes?semester_id=&round_id= — ADMIN, MANAGER. semester_id bắt buộc theo manager-api.md §3 */
  outcomes: async (semesterId?: number | null, roundId?: number | null): Promise<OutcomesReportResponse> => {
    const response = await apiService.get<OutcomesReportResponse>("api/v1/reports/outcomes", {
      semester_id: semesterId ?? undefined,
      round_id: roundId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/provenance/{version_id}?semester_id= — tất cả role, Manager luôn trong scope */
  provenance: async (versionId: number, semesterId?: number | null): Promise<ProvenanceResponse> => {
    const response = await apiService.get<ProvenanceResponse>(`api/v1/reports/provenance/${versionId}`, {
      semester_id: semesterId ?? undefined,
    });
    return response.data;
  },

  /** GET /reports/group-progress?semester_id= — CHƯA CÓ Ở BACKEND, đề xuất tại manager-api.md §8.6 */
  /**
   * BE có thể trả mảng phẳng HOẶC `{data: [...], meta}` qua success_payload() tuỳ đã migrate
   * hay chưa (xem docs/be-checklist-open-questions.md mục 6) — chấp nhận cả 2 dạng cho an toàn.
   */
  groupProgress: async (semesterId?: number | null): Promise<GroupProgressRow[]> => {
    const response = await apiService.get<unknown>("api/v1/reports/group-progress", {
      semester_id: semesterId ?? undefined,
    });
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: unknown[] }).data
        : [];
    return snakeizeKeys<GroupProgressRow[]>(list);
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
