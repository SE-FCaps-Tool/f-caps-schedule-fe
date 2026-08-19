import apiService from "../core";
import type { RoundType, RoundInvitationStatus } from "./fetchRounds";
import type { ReviewResult, DefenseResult } from "./fetchResults";
import type { ProjectStatus } from "./fetchProjects";
import { formatInVietnamTime } from "@/lib/utils/formatDate";

/** capstone-fe-be-implementation-spec.md §5 — IMPLEMENTATION PROPOSAL */
export type PreferredLoad = "LOW" | "MEDIUM" | "HIGH";

export interface LecturerInvitation {
  id: string;
  round: {
    id: string;
    name: string;
    type: RoundType;
    registrationDeadline: string;
  };
  status: RoundInvitationStatus;
  respondedAt: string | null;
}

export type RespondInvitationPayload = { decision: "ACCEPTED" } | { decision: "DECLINED"; reason: string };

export interface AvailabilitySlot {
  timeslotId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface LecturerAvailability {
  preferredLoad: PreferredLoad | null;
  slots: AvailabilitySlot[];
}

export interface LecturerAvailabilityResponse {
  round: unknown;
  timeslots: {
    id: number | string;
    startAt: string;
    endAt: string;
    dayDate: string;
  }[];
  lecturerId: number | string;
  selectedTimeslotIds: (number | string)[];
}

/** Adapt BE availability data without inventing a preferred load not supplied by the API. */
export function adaptLecturerAvailability(response: LecturerAvailabilityResponse): LecturerAvailability {
  const selectedIds = new Set(response.selectedTimeslotIds.map(String));
  return {
    preferredLoad: null,
    slots: response.timeslots.map((slot) => ({
      timeslotId: String(slot.id),
      date: formatInVietnamTime(slot.startAt, "YYYY-MM-DD"),
      startTime: formatInVietnamTime(slot.startAt, "HH:mm"),
      endTime: formatInVietnamTime(slot.endAt, "HH:mm"),
      available: selectedIds.has(String(slot.id)),
    })),
  };
}

export interface SubmitAvailabilityPayload {
  preferredLoad: PreferredLoad;
  slots: { timeslotId: string; available: boolean }[];
}

export const fetchLecturerPortal = {
  /** GET /lecturer/me/invitations — spec §31 */
  invitations: async (): Promise<LecturerInvitation[]> => {
    const response = await apiService.get<{ data: LecturerInvitation[] }>("api/v1/lecturer/me/invitations");
    return response.data.data;
  },

  /** POST /rounds/:roundId/invitations/me/respond — spec §31/§54. Decline bắt buộc reason */
  respondInvitation: async (roundId: string, payload: RespondInvitationPayload): Promise<void> => {
    await apiService.post(`api/v1/rounds/${roundId}/invitations/me/respond`, payload);
  },

  /** GET /rounds/:roundId/availability/me — spec §32/§55 */
  availability: async (roundId: string): Promise<LecturerAvailability> => {
    const response = await apiService.get<{ data: LecturerAvailabilityResponse }>(
      `api/v1/rounds/${roundId}/availability/me`
    );
    return adaptLecturerAvailability(response.data.data);
  },

  /**
   * PUT /rounds/:roundId/availability/me — spec §32/§55.
   * Chỉ nộp được khi Round OPEN_REGISTRATION và Invitation ACCEPTED (BE validate).
   */
  submitAvailability: async (roundId: string, payload: SubmitAvailabilityPayload): Promise<void> => {
    await apiService.put(`api/v1/rounds/${roundId}/availability/me`, payload);
  },

  /** GET /lecturer/me/sessions — spec §33 */
  mySessions: async (params: MySessionsParams): Promise<LecturerScheduleSession[]> => {
    const response = await apiService.get<{ data: LecturerScheduleSession[] }>("api/v1/lecturer/me/sessions", {
      roundId: params.roundId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      role: params.role,
      status: params.status,
    });
    return response.data.data;
  },

  /** GET /sessions/:sessionId — spec §35 */
  sessionDetail: async (sessionId: string): Promise<LecturerSessionDetail> => {
    const response = await apiService.get<{ data: LecturerSessionDetail }>(`api/v1/sessions/${sessionId}`);
    return response.data.data;
  },

  /** GET /lecturer/me/supervised-projects — spec §34 */
  supervisedProjects: async (): Promise<SupervisedProject[]> => {
    const response = await apiService.get<{ data: SupervisedProject[] }>("api/v1/lecturer/me/supervised-projects");
    return response.data.data;
  },

  /** GET /lecturer/me/remediations — spec §36 */
  remediations: async (): Promise<LecturerRemediation[]> => {
    const response = await apiService.get<{ data: LecturerRemediation[] }>("api/v1/lecturer/me/remediations");
    return response.data.data;
  },
};

/**
 * Phần dưới đây theo spec §33/§35 (Phase 9b — Lecturer Schedule + Session Result).
 * Cũng như invitations/availability ở trên, spec chỉ có route path, không có JSON mẫu —
 * field đặt tên theo suy luận hợp lý từ mock UI cũ (app/(lecturer)/lecturer/schedule) và
 * pattern DisplaySession đã dùng ở Manager calendar (Phase 7), cần BE xác nhận.
 */

/** spec §7 SessionStatus — bỏ PLANNED vì lecturer chỉ thấy session đã publish */
export type LecturerScheduleSessionStatus = "SCHEDULED" | "COMPLETED" | "POSTPONED" | "GROUP_ABSENT" | "CANCELLED";

export type LecturerSessionRole = "REVIEWER" | "RESULT_OWNER";

export interface MySessionsParams {
  roundId?: string;
  dateFrom?: string;
  dateTo?: string;
  role?: LecturerSessionRole;
  status?: LecturerScheduleSessionStatus;
}

export interface LecturerScheduleSession {
  id: string;
  round: { id: string; name: string; type: RoundType };
  group: { id: string; code: string; projectTitle: string | null };
  date: string;
  startTime: string;
  endTime: string;
  roomCode: string | null;
  myRole: LecturerSessionRole;
  council: { id: string; name: string }[];
  status: LecturerScheduleSessionStatus;
}

export interface LecturerSessionResult {
  type: "REVIEW" | "DEFENSE";
  value: ReviewResult | DefenseResult;
  note: string | null;
}

export interface LecturerSessionDetail extends LecturerScheduleSession {
  result: LecturerSessionResult | null;
}

/**
 * spec §34 (Phase 9c — Supervised Groups). Không có JSON mẫu trong spec — field list
 * lấy đúng theo mục "Fields" của §34 (Group/Project/Leader/Member Count/Project Status/
 * Next Evaluation/Latest Result/Remediation), `supervisorRole` là suy luận thêm từ
 * SupervisorRole enum §3 để phân biệt GVHD chính/đồng hướng dẫn trên UI — cần BE xác nhận.
 * Spec ghi rõ "Không có membership management" nên KHÔNG có action đổi Leader ở màn này
 * (khác với Manager §14 change-leader).
 */
export type RemediationStatus = "PENDING" | "PASSED" | "OVERDUE" | "FAILED";

export interface SupervisedProject {
  id: string;
  code: string;
  titleVi: string;
  supervisorRole: "MAIN" | "CO";
  group: {
    id: string;
    code: string;
    memberCount: number;
    leader: { id: string; name: string; code: string } | null;
  } | null;
  projectStatus: ProjectStatus;
  nextEvaluation: { roundType: RoundType; date: string | null } | null;
  latestResult: {
    roundType: RoundType;
    kind: "REVIEW" | "DEFENSE";
    value: ReviewResult | DefenseResult;
    date: string;
  } | null;
  remediation: {
    deadline: string;
    verifierName: string;
    status: RemediationStatus;
  } | null;
}

/**
 * spec §36 (Phase 9d — Remediation). Không có JSON mẫu — field suy luận từ domain: mỗi
 * remediation gắn với 1 Group (được tạo khi Defense 1.1 LEVEL_2, spec §75), verifier là
 * Lecturer hiện tại (đã được chỉ định lúc submit result §74) nên không cần field verifier
 * riêng ở đây. Verify dùng lại `fetchResults.verifyRemediation` đã có từ Phase 8 (cùng route
 * POST /remediations/:remediationId/verify).
 */
export interface LecturerRemediation {
  id: string;
  group: { id: string; code: string; projectTitle: string | null };
  deadline: string;
  status: RemediationStatus;
}
