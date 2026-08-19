import apiService from "../core";
import type { RoundType, RoundStatus } from "./fetchRounds";
import type { ProjectStatus } from "./fetchProjects";
import type { ReviewResult, DefenseResult } from "./fetchResults";
import type { RemediationStatus } from "./fetchLecturerPortal";
import { formatInVietnamTime } from "@/lib/utils/formatDate";

/**
 * capstone-fe-be-implementation-spec.md PHẦN V — FE Project Leader (§37-40, Phase 9e).
 * "Project Leader" = role STUDENT hiện tại khi đang là Leader active của nhóm (đã chốt qua
 * lib/types/roles.ts CONTEXT_ROLE_PROJECT_LEADER — không phải role tài khoản riêng).
 * Không có JSON mẫu cho cả 3 endpoint dưới đây trong spec — field đặt theo đúng "Fields" list
 * ghi trong §38, và theo pattern DisplaySession/SupervisedProject đã dùng ở Manager/Lecturer.
 */

export type PreferenceStatus = "NOT_REQUIRED" | "PENDING" | "SUBMITTED";

export interface LeaderDashboard {
  group: { id: string; code: string; memberCount: number; maxMembers: number } | null;
  project: { id: string; code: string; titleVi: string; titleEn: string | null; status: ProjectStatus } | null;
  mainSupervisor: { id: string; name: string } | null;
  coSupervisor: { id: string; name: string } | null;
  currentRound: { id: string; name: string; type: RoundType; status: RoundStatus } | null;
  preferenceStatus: PreferenceStatus | null;
  deadline: string | null;
  upcomingSession: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string | null;
  } | null;
  latestResult: {
    roundType: RoundType;
    kind: "REVIEW" | "DEFENSE";
    value: ReviewResult | DefenseResult;
    date: string;
  } | null;
  remediation: { deadline: string; status: RemediationStatus } | null;
}

/** spec §39 */
export interface GroupPreference {
  timeslotId: string;
  date: string;
  startTime: string;
  endTime: string;
  selected: boolean;
}

export interface SubmitGroupPreferencePayload {
  timeslotIds: string[];
}

export interface GroupPreferencesResponse {
  roundId: number | string;
  groupId: number | string;
  timeslots: {
    timeslotId: number | string;
    startAt: string;
    endAt: string;
    selected: boolean | null;
    source: string | null;
  }[];
}

/** Adapt the BE aggregate response to the flat slot list consumed by the Leader UI. */
export function adaptGroupPreferences(response: GroupPreferencesResponse): GroupPreference[] {
  return response.timeslots.map((slot) => ({
    timeslotId: String(slot.timeslotId),
    date: formatInVietnamTime(slot.startAt, "YYYY-MM-DD"),
    startTime: formatInVietnamTime(slot.startAt, "HH:mm"),
    endTime: formatInVietnamTime(slot.endAt, "HH:mm"),
    selected: slot.selected === true,
  }));
}

/** spec §40 */
export type LeaderSessionStatus = "SCHEDULED" | "COMPLETED" | "POSTPONED" | "GROUP_ABSENT" | "CANCELLED";

export interface LeaderSession {
  id: string;
  round: { id: string; name: string; type: RoundType };
  date: string;
  startTime: string;
  endTime: string;
  roomCode: string | null;
  council: { name: string }[];
  status: LeaderSessionStatus;
}

export const fetchLeaderPortal = {
  /** GET /leader/me/dashboard — spec §38 */
  dashboard: async (): Promise<LeaderDashboard> => {
    const response = await apiService.get<{ data: LeaderDashboard }>("api/v1/leader/me/dashboard");
    return response.data.data;
  },

  /** GET /rounds/:roundId/groups/:groupId/preferences — spec §39 */
  groupPreferences: async (roundId: string, groupId: string): Promise<GroupPreference[]> => {
    const response = await apiService.get<{ data: GroupPreferencesResponse }>(
      `api/v1/rounds/${roundId}/groups/${groupId}/preferences`
    );
    return adaptGroupPreferences(response.data.data);
  },

  /**
   * PUT /rounds/:roundId/groups/:groupId/preferences — spec §39/§56.
   * Chỉ submit được khi: current user = active Leader, groupSelectionMode=true, Round OPEN_REGISTRATION.
   */
  submitGroupPreferences: async (
    roundId: string,
    groupId: string,
    payload: SubmitGroupPreferencePayload
  ): Promise<void> => {
    await apiService.put(`api/v1/rounds/${roundId}/groups/${groupId}/preferences`, payload);
  },

  /** GET /leader/me/sessions — spec §40. Không show ScheduleVersion/Soft Score/Quota/solver data. */
  mySessions: async (): Promise<LeaderSession[]> => {
    const response = await apiService.get<{ data: LeaderSession[] }>("api/v1/leader/me/sessions");
    return response.data.data;
  },
};
