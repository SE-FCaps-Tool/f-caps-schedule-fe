import apiService from "../core";
import type { RoundType, RoundInvitationStatus } from "./fetchRounds";
import type { RoundResult } from "./fetchResults";
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

/** BE trả camelCase cho endpoint này (đã xác nhận với BE — khác endpoint /my-availability của Manager dùng snake_case). */
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

  /**
   * GET /lecturer/me/sessions — spec §33. Contract xác nhận qua
   * docs/api/lecturer-sessions-fe-guide.md (BE repo): row phẳng, camelCase, không có
   * council/reviewer/myRole — BE tự lọc theo lecturer đăng nhập, không cần lecturerId.
   */
  mySessions: async (params: MySessionsParams): Promise<LecturerScheduleSession[]> => {
    const response = await apiService.get<{ data: LecturerSessionApi[] }>("api/v1/lecturer/me/sessions", {
      roundId: params.roundId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
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
  status?: LecturerScheduleSessionStatus;
}

export interface LecturerScheduleSession {
  id: string;
  roundId: string;
  roundType: RoundType;
  groupId: string;
  groupCode: string;
  projectCode: string;
  date: string;
  startTime: string;
  endTime: string;
  roomCode: string | null;
  status: LecturerScheduleSessionStatus;
}

/**
 * Row thật BE trả cho GET /lecturer/me/sessions — theo
 * docs/api/lecturer-sessions-fe-guide.md (BE repo, handoff chính thức). CamelCase, phẳng,
 * không có round/group lồng nhau; không có council/reviewer/myRole (BE chưa expose cho
 * Lecturer — POST .../result tự enforce quyền REVIEWER/RESULT_OWNER phía server, trả 403
 * nếu sai, nên FE không cần biết trước myRole để gate nút "Nhập kết quả").
 */
export interface LecturerSessionApi {
  id: number;
  roundId: number;
  startAt: string;
  endAt: string;
  status: LecturerScheduleSessionStatus;
  groupId: number;
  groupCode: string;
  projectCode: string;
  roomCode: string | null;
  roundType: RoundType;
}

export function adaptLecturerSession(dto: LecturerSessionApi): LecturerScheduleSession {
  return {
    id: String(dto.id),
    roundId: String(dto.roundId),
    roundType: dto.roundType,
    groupId: String(dto.groupId),
    groupCode: dto.groupCode,
    projectCode: dto.projectCode,
    date: formatInVietnamTime(dto.startAt, "YYYY-MM-DD"),
    startTime: formatInVietnamTime(dto.startAt, "HH:mm"),
    endTime: formatInVietnamTime(dto.endAt, "HH:mm"),
    roomCode: dto.roomCode,
    status: dto.status,
  };
}

export interface LecturerSessionResult {
  type: "REVIEW" | "DEFENSE";
  value: RoundResult;
  note: string | null;
}

export interface LecturerSessionDetail extends LecturerScheduleSession {
  result: LecturerSessionResult | null;
  /**
   * GET /sessions/:sessionId hiện chỉ ADMIN/MANAGER gọi được (403 với Lecturer) — BE chưa
   * có route lecturer-scoped trả council. Giữ optional để UI không vỡ, cần BE bổ sung.
   */
  council?: { id: string; name: string }[];
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

export interface SupervisedProjectGroupMember {
  id: string;
  name: string;
  code: string;
  role: "LEADER" | "MEMBER";
  status: "ACTIVE" | "DROPPED";
}

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
    members: SupervisedProjectGroupMember[];
  } | null;
  projectStatus: ProjectStatus;
  nextEvaluation: { roundType: RoundType; date: string | null } | null;
  latestResult: {
    roundType: RoundType;
    kind: "REVIEW" | "DEFENSE";
    value: RoundResult;
    date: string;
  } | null;
  remediation: {
    deadline: string;
    verifierName: string;
    status: RemediationStatus;
  } | null;
}

export interface SupervisedProjectApiGroupMember {
  id: number | string;
  name: string;
  code: string;
  role: "LEADER" | "MEMBER";
  status: "ACTIVE" | "DROPPED";
}

export interface SupervisedProjectApiGroup {
  id: number | string;
  code: string;
  memberCount: number;
  leader: { id: number | string; name: string; code: string } | null;
  members: SupervisedProjectApiGroupMember[];
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
  /** group đã được BE bổ sung (member list + leader) — nextEvaluation/latestResult/remediation vẫn chưa có. */
  group: SupervisedProjectApiGroup | null;
}

/**
 * BE contract gap: nextEvaluation/latestResult/remediation chưa được trả — giữ null cho tới
 * khi BE bổ sung, UI đã có fallback cho các field null này. group giờ đã có leader + members.
 */
export function adaptSupervisedProject(dto: SupervisedProjectApi): SupervisedProject {
  return {
    id: String(dto.id),
    code: dto.code,
    titleVi: dto.title,
    supervisorRole: dto.supervisor_type,
    group: dto.group
      ? {
          id: String(dto.group.id),
          code: dto.group.code,
          memberCount: dto.group.memberCount,
          leader: dto.group.leader
            ? { id: String(dto.group.leader.id), name: dto.group.leader.name, code: dto.group.leader.code }
            : null,
          members: dto.group.members.map((member) => ({
            id: String(member.id),
            name: member.name,
            code: member.code,
            role: member.role,
            status: member.status,
          })),
        }
      : null,
    projectStatus: dto.status as ProjectStatus,
    nextEvaluation: null,
    latestResult: null,
    remediation: null,
  };
}

/**
 * spec §36 (Phase 9d — Remediation). Không có JSON mẫu — field suy luận từ domain: mỗi
 * remediation gắn với 1 Group (được tạo khi Review 3 LEVEL_2, spec §75), verifier là
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
