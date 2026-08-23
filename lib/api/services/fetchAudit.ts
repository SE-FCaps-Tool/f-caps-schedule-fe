import apiService from "../core";

export interface AuditEntryApi {
  id: number;
  actorId: number;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  occurredAt: string;
}

export interface AuditListParams {
  actorId?: number;
  action?: string;
  entityType?: string;
  limit?: number;
}

export const fetchAudit = {
  /** GET /audit?actorId=&action=&entityType=&limit= — ADMIN only */
  list: async (params?: AuditListParams): Promise<AuditEntryApi[]> => {
    const response = await apiService.get<AuditEntryApi[], AuditListParams>("api/v1/audit", params);
    return response.data;
  },
};
