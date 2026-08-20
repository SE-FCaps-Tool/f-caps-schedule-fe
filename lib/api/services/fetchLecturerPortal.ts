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

/** BE trả legacy snake_case cho endpoint này (đã xác nhận với BE — không phải spec camelCase). */
export interface LecturerAvailabilityResponse {
  round: unknown;
  timeslots: {
    id: number | string;
    start_at: string;
    end_at: string;
    day_date: string;
  }[];
  lecturer_id: number | string;
  selected_timeslot_ids: (number | string)[];
}

/** Adapt BE availability data without inventing a preferred load not supplied by the API. */
export function adaptLecturerAvailability(response: LecturerAvailabilityResponse): LecturerAvailability {
  const selectedIds = new Set(response.selected_timeslot_ids.map(String));
  return {
    preferredLoad: null,
    slots: response.timeslots.map((slot) => ({
      timeslotId: String(slot.id),
      date: formatInVietnamTime(slot.start_at, "YYYY-MM-DD"),
      startTime: formatInVietnamTime(slot.start_at, "HH:mm"),
      endTime: formatInVietnamTime(slot.end_at, "HH:mm"),
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

  /** GET /lecturer/me/sessions — spec §33. BE trả flat row (round/group/council chưa lồng nhau) — adapt thủ công. */
  mySessions: async (params: MySessionsParams): Promise<LecturerScheduleSession[]> => {
    const response = await apiService.get<{ data: LecturerSessionApi[] }>("api/v1/lecturer/me/sessions", {
      roundId: params.roundId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      role: params.role,
      status: params.status,
    });
    return response.data.data.map(adaptLecturerSession);
  },

  /** GET /sessions/:sessionId — spec §35 */
  sessionDetail: async (sessionId: string): Promise<LecturerSessionDetail> => {
    const response = await apiService.get<{ data: LecturerSessionDetail }>(`api/v1/sessions/${sessionId}`);
    return response.data.data;
  },

  /**
   * GET /lecturer/me/supervised-projects — spec §34. BE hiện chỉ trả row phẳng
   * (id/code/title/status project DB ACTIVE|ARCHIVED, không có group/leader/latestResult/
   * remediation) — contract gap đã báo BE, chưa có ETA. Adapt tạm những field có sẵn,
   * phần thiếu giữ null để UI hiện fallback thay vì crash.
   */
  supervisedProjects: async (): Promise<SupervisedProject[]> => {
    const response = await apiService.get<{ data: SupervisedProjectApi[] }>("api/v1/lecturer/me/supervised-projects");
    return response.data.data.map(adaptSupervisedProject);
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
  round: { id: string; name: string; type: RoundType } | null;
  group: { id: string; code: string; projectTitle: string | null } | null;
  date: string;
  startTime: string;
  endTime: string;
  roomCode: string | null;
  myRole: LecturerSessionRole;
  council: { id: string; name: string }[];
  status: LecturerScheduleSessionStatus;
}

/** Row phẳng thật sự BE trả cho GET /lecturer/me/sessions — đã xác nhận với BE. */
export interface LecturerSessionApi {
  id: number | string;
  round_id: number | string;
  round_type: RoundType;
  group_id?: number | string | null;
  group_code?: string | null;
  project_code?: string | null;
  start_at: string;
  end_at: string;
  room_id?: number | string | null;
  room_code?: string | null;
  status: LecturerScheduleSessionStatus;
  my_role?: LecturerSessionRole;
  council?: { id: number | string; name: string }[];
}

/** round.name không có trong response thật — dùng round_type làm fallback hiển thị. */
export function adaptLecturerSession(dto: LecturerSessionApi): LecturerScheduleSession {
  return {
    id: String(dto.id),
    round: { id: String(dto.round_id), name: dto.round_type, type: dto.round_type },
    group:
      dto.group_id == null
        ? null
        : { id: String(dto.group_id), code: dto.group_code ?? "", projectTitle: dto.project_code ?? null },
    date: formatInVietnamTime(dto.start_at, "YYYY-MM-DD"),
    startTime: formatInVietnamTime(dto.start_at, "HH:mm"),
    endTime: formatInVietnamTime(dto.end_at, "HH:mm"),
    roomCode: dto.room_code ?? null,
    // BE chưa trả field vai trò của lecturer trong session — tạm mặc định REVIEWER, cần BE xác nhận.
    myRole: dto.my_role ?? "REVIEWER",
    council: (dto.council ?? []).map((c) => ({ id: String(c.id), name: c.name })),
    status: dto.status,
  };
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

/** Row phẳng thật sự BE trả cho GET /lecturer/me/supervised-projects — đã xác nhận với BE. */
export interface SupervisedProjectApi {
  id: number | string;
  code: string;
  title: string;
  /** Trạng thái project DB (ACTIVE|ARCHIVED) — KHÔNG phải 8 enum ProjectStatus của spec §3. */
  status: string;
  semester_id?: number | string;
  semester_code?: string;
  supervisor_type: "MAIN" | "CO";
}

/**
 * BE contract gap: group/leader/nextEvaluation/latestResult/remediation chưa được trả —
 * giữ null cho tới khi BE bổ sung, UI đã có fallback cho các field null này.
 */
export function adaptSupervisedProject(dto: SupervisedProjectApi): SupervisedProject {
  return {
    id: String(dto.id),
    code: dto.code,
    titleVi: dto.title,
    supervisorRole: dto.supervisor_type,
    group: null,
    projectStatus: dto.status as ProjectStatus,
    nextEvaluation: null,
    latestResult: null,
    remediation: null,
  };
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
