import apiService from "../core";
import type { ListMeta } from "@/types/api";

export interface TimeframeBreakWindow {
  name: string;
  startTime: string;
  endTime: string;
}

export interface ManualTimeline {
  startTime: string;
  endTime: string;
  groupsPerSlot: number;
}

export interface QuickTimeframePreviewRequest {
  startTime: string;
  endTime: string;
  blockDurationMinutes: number;
  groupDurationMinutes: number;
  breakBetweenBlocksMinutes?: number;
  breakWindows?: TimeframeBreakWindow[];
}

export interface QuickTimeframeMutationRequest
  extends QuickTimeframePreviewRequest {
  name: string;
  type: string;
  reason?: string | null;
}

export interface ManualTimeframePreviewRequest {
  groupDurationMinutes: number;
  timelines: ManualTimeline[];
}

export interface ManualTimeframeMutationRequest
  extends ManualTimeframePreviewRequest {
  name: string;
  type: string;
  reason?: string | null;
}

export type TimeframePreviewRequest = QuickTimeframePreviewRequest;
export type TimeframeMutationRequest = QuickTimeframeMutationRequest;

export interface TimeframeGroupSlot {
  sequenceNumber: number;
  startTime: string;
  endTime: string;
}

export interface TimeframeBlock {
  sequenceNumber: number;
  startTime: string;
  endTime: string;
  groupSlots: TimeframeGroupSlot[];
}

export interface TimeframePreview {
  startTime: string;
  endTime: string;
  blockDurationMinutes: number | null;
  groupDurationMinutes: number;
  breakBetweenBlocksMinutes: number | null;
  breakWindows: TimeframeBreakWindow[];
  manualTimelines: ManualTimeline[] | null;
  blocksPerDay: number;
  groupsPerBlock: number | null;
  capacityPerDay: number;
  unusedMinutes: number;
  breakWindowMinutes: number;
  appliedBlockBreakMinutes: number | null;
  totalBreakMinutes: number;
  blocks: TimeframeBlock[];
}

export interface Timeframe extends TimeframePreview {
  id: number;
  name: string;
  type: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version?: {
    id: number;
    number: number;
    status: "ACTIVE" | "SUPERSEDED";
    reason: string | null;
    createdAt: string;
  } | null;
  revisions?: Array<{
    id: number;
    versionNumber: number;
    status: "ACTIVE" | "SUPERSEDED";
    startTime: string;
    endTime: string;
    blockDurationMinutes: number | null;
    groupDurationMinutes: number;
    breakBetweenBlocksMinutes: number | null;
    breakWindows: TimeframeBreakWindow[];
    manualTimelines: ManualTimeline[] | null;
    changeReason: string | null;
    createdBy: number | null;
    createdAt: string;
  }>;
}

export interface TimeframeListResponse {
  data: Timeframe[];
  meta?: ListMeta;
}

export const fetchTimeframes = {
  preview: async (payload: TimeframePreviewRequest): Promise<TimeframePreview> => {
    const response = await apiService.post<{ data: TimeframePreview }, TimeframePreviewRequest>(
      "api/v1/timeframes/preview",
      payload
    );
    return response.data.data;
  },

  manualPreview: async (
    payload: ManualTimeframePreviewRequest,
  ): Promise<TimeframePreview> => {
    const response = await apiService.post<{ data: TimeframePreview }, ManualTimeframePreviewRequest>(
      "api/v1/timeframes/manual/preview",
      payload,
    );
    return response.data.data;
  },

  list: async (includeArchived = false): Promise<{ data: Timeframe[]; meta?: ListMeta }> => {
    const response = await apiService.get<TimeframeListResponse, { includeArchived?: boolean }>(
      "api/v1/timeframes",
      { includeArchived: includeArchived || undefined }
    );
    return response.data;
  },

  getById: async (id: number): Promise<Timeframe> => {
    const response = await apiService.get<{ data: Timeframe }>(`api/v1/timeframes/${id}`);
    return response.data.data;
  },

  create: async (payload: TimeframeMutationRequest): Promise<Timeframe> => {
    const response = await apiService.post<{ data: Timeframe }, TimeframeMutationRequest>(
      "api/v1/timeframes",
      payload
    );
    return response.data.data;
  },

  createManual: async (
    payload: ManualTimeframeMutationRequest,
  ): Promise<Timeframe> => {
    const response = await apiService.post<{ data: Timeframe }, ManualTimeframeMutationRequest>(
      "api/v1/timeframes/manual",
      payload,
    );
    return response.data.data;
  },

  update: async (id: number, payload: TimeframeMutationRequest): Promise<Timeframe> => {
    const response = await apiService.patch<{ data: Timeframe }, TimeframeMutationRequest>(
      `api/v1/timeframes/${id}`,
      payload
    );
    return response.data.data;
  },

  updateManual: async (
    id: number,
    payload: ManualTimeframeMutationRequest,
  ): Promise<Timeframe> => {
    const response = await apiService.patch<{ data: Timeframe }, ManualTimeframeMutationRequest>(
      `api/v1/timeframes/${id}/manual`,
      payload,
    );
    return response.data.data;
  },

  archive: async (id: number, reason: string): Promise<Timeframe> => {
    const response = await apiService.request<{ data: Timeframe }>({
      method: "DELETE",
      url: `api/v1/timeframes/${id}`,
      data: { reason },
    });
    return response.data.data;
  },
};
