import apiService from "../core";

export type ManualReviewerRole =
  | "REVIEWER_1"
  | "REVIEWER_2"
  | "CHAIR"
  | "SECRETARY"
  | `MEMBER_${number}`;

export interface ManualBlocker {
  code: string;
  message: string;
  sessionId?: string | null;
  field?: string | null;
  relatedSessionIds?: string[];
  [key: string]: unknown;
}

export interface ManualScheduleReviewer {
  lecturerId: string;
  lecturerCode: string;
  lecturerName: string;
  role: ManualReviewerRole;
  roleLabel: string;
  order: number;
}

export interface ManualScheduleGroup {
  groupId: string;
  groupCode: string;
  leaderName: string | null;
  activeMemberCount: number;
  supervisorIds: string[];
}

export interface ManualScheduleRoom {
  roomId: number;
  roomCode: string;
  roomName: string;
  type: string;
  capacity: number;
}

export interface ManualScheduleSession {
  id: string;
  date: string;
  roundTimeslotId: string;
  startTime: string;
  endTime: string;
  groups: ManualScheduleGroup[];
  room: ManualScheduleRoom | null;
  reviewers: ManualScheduleReviewer[];
  status: "DRAFT" | "READY" | "PUBLISHED" | string;
  blockers: ManualBlocker[];
  warnings: ManualBlocker[];
}

export interface ManualScheduleBoard {
  roundId: string;
  roundStatus: string;
  reviewerCount: number;
  maxGroupsPerTimeslot: number | null;
  revision: number;
  sourceVersionId: number | null;
  roles: Array<{ key: ManualReviewerRole; label: string; order: number }>;
  config: {
    roomTypes: string[];
    batchSize: number | null;
    chairMinLevel: number | null;
    secretaryMinLevel: number | null;
    maxSameSupervisorRatio: number | null;
    eligibleProjectStatuses: string[];
  };
  summary: {
    eligibleGroupCount: number;
    scheduledGroupCount: number;
    unscheduledGroupIds: string[];
    incompleteSessionIds: string[];
    sessionCount: number;
    incompleteSessionCount: number;
    blockerCount: number;
    warningCount: number;
  };
  sessions: ManualScheduleSession[];
}

export type ManualScheduleResponse = ManualScheduleBoard;

export interface ManualScheduleOptionsParams {
  date?: string;
  roundTimeslotId?: string | number;
  sessionId?: string | number;
  role?: ManualReviewerRole;
  reviewerIds?: Array<string | number>;
  groupIds?: Array<string | number>;
  roomId?: string | number | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ManualScheduleOptionState {
  available: boolean;
  blockedReason: string | null;
  blockedCodes: string[];
}

export interface ManualLecturerOption extends ManualScheduleOptionState {
  lecturerId: string;
  lecturerCode: string;
  lecturerName: string;
  eligibleRoles: ManualReviewerRole[];
}

export interface ManualGroupOption extends ManualScheduleOptionState {
  groupId: string;
  groupCode: string;
  leaderName: string | null;
  activeMemberCount: number;
  supervisorIds: string[];
  selectedByGroup: boolean;
}

export interface ManualRoomOption extends ManualScheduleRoom, ManualScheduleOptionState {}

export interface ManualScheduleOptions {
  lecturers: ManualLecturerOption[];
  groups: ManualGroupOption[];
  rooms: ManualRoomOption[];
}

export interface ManualScheduleOptionsResponse {
  options: ManualScheduleOptions;
  meta?: { page: number; pageSize: number };
}

export interface ManualScheduleReviewerInput {
  lecturerId: string | number;
  role: ManualReviewerRole;
  order?: number | null;
}

export interface ManualScheduleSessionPayload {
  id?: string | number | null;
  date?: string | null;
  roundTimeslotId: string | number;
  groupIds: Array<string | number>;
  roomId?: string | number | null;
  reviewers: ManualScheduleReviewerInput[];
  clientRevision?: number | null;
}

export interface ManualScheduleBulkUpsertPayload {
  clientRevision?: number | null;
  allowDraftIncomplete?: boolean;
  deletedSessionIds?: Array<string | number>;
  sourceVersionId?: number | null;
  sessions: Array<Omit<ManualScheduleSessionPayload, "clientRevision">>;
}

export interface ManualScheduleMutationResponse {
  revision: number;
  session: ManualScheduleSession;
}

export interface ManualScheduleValidationResponse {
  revision: number;
  valid: boolean;
  blockers: ManualBlocker[];
  warnings: ManualBlocker[];
  summary: ManualScheduleBoard["summary"];
}

export interface ManualPublishReadinessResponse {
  ready: boolean;
  revision: number;
  checks: Array<{ code: string; passed: boolean; count: number }>;
  blockers: ManualBlocker[];
  warnings: ManualBlocker[];
}

export interface ManualPublishPayload {
  clientRevision?: number | null;
  confirmWarnings?: string[];
  reason?: string | null;
}

type DataEnvelope<T> = { data: T };
type OptionsEnvelope = { data: ManualScheduleOptions; meta?: { page: number; pageSize: number } };

export const fetchManualScheduling = {
  get: async (roundId: string): Promise<ManualScheduleBoard> => {
    const response = await apiService.get<DataEnvelope<ManualScheduleBoard>>(
      `api/v1/rounds/${roundId}/manual-schedule`
    );
    return response.data.data;
  },

  options: async (roundId: string, params: ManualScheduleOptionsParams): Promise<ManualScheduleOptionsResponse> => {
    const response = await apiService.get<
      OptionsEnvelope,
      ManualScheduleOptionsParams
    >(`api/v1/rounds/${roundId}/manual-schedule/options`, params);
    return { options: response.data.data, meta: response.data.meta };
  },

  createSession: async (
    roundId: string,
    payload: ManualScheduleSessionPayload
  ): Promise<ManualScheduleMutationResponse> => {
    const response = await apiService.post<
      DataEnvelope<ManualScheduleMutationResponse>,
      ManualScheduleSessionPayload
    >(`api/v1/rounds/${roundId}/manual-schedule/sessions`, payload);
    return response.data.data;
  },

  updateSession: async (
    roundId: string,
    sessionId: string,
    payload: ManualScheduleSessionPayload
  ): Promise<ManualScheduleMutationResponse> => {
    const response = await apiService.patch<
      DataEnvelope<ManualScheduleMutationResponse>,
      ManualScheduleSessionPayload
    >(`api/v1/rounds/${roundId}/manual-schedule/sessions/${sessionId}`, payload);
    return response.data.data;
  },

  deleteSession: async (
    roundId: string,
    sessionId: string,
    clientRevision?: number | null
  ): Promise<{ id: string; deleted: boolean; revision: number }> => {
    const response = await apiService.delete<
      DataEnvelope<{ id: string; deleted: boolean; revision: number }>,
      { clientRevision?: number | null }
    >(`api/v1/rounds/${roundId}/manual-schedule/sessions/${sessionId}`, { clientRevision });
    return response.data.data;
  },

  bulkUpsert: async (
    roundId: string,
    payload: ManualScheduleBulkUpsertPayload
  ): Promise<ManualScheduleBoard> => {
    const response = await apiService.post<DataEnvelope<ManualScheduleBoard>, ManualScheduleBulkUpsertPayload>(
      `api/v1/rounds/${roundId}/manual-schedule/sessions/bulk-upsert`,
      payload
    );
    return response.data.data;
  },

  validate: async (
    roundId: string,
    clientRevision?: number | null
  ): Promise<ManualScheduleValidationResponse> => {
    const response = await apiService.post<
      DataEnvelope<ManualScheduleValidationResponse>,
      { clientRevision?: number | null }
    >(`api/v1/rounds/${roundId}/manual-schedule/validate`, { clientRevision });
    return response.data.data;
  },

  publishReadiness: async (roundId: string): Promise<ManualPublishReadinessResponse> => {
    const response = await apiService.get<DataEnvelope<ManualPublishReadinessResponse>>(
      `api/v1/rounds/${roundId}/manual-schedule/publish-readiness`
    );
    return response.data.data;
  },

  publish: async (
    roundId: string,
    payload: ManualPublishPayload
  ): Promise<{
    roundId: string;
    versionId: string;
    status: "PUBLISHED";
    publishedAt: string;
    publishedBy: string | null;
    summary: ManualScheduleBoard["summary"];
  }> => {
    const response = await apiService.post<
      DataEnvelope<{
        roundId: string;
        versionId: string;
        status: "PUBLISHED";
        publishedAt: string;
        publishedBy: string | null;
        summary: ManualScheduleBoard["summary"];
      }>,
      ManualPublishPayload
    >(`api/v1/rounds/${roundId}/manual-schedule/publish`, payload);
    return response.data.data;
  },
};
