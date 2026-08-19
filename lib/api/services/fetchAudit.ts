import apiService from "../core";

export interface AuditEntryApi {
  id: number;
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  occurred_at: string;
}

export interface AuditListParams {
  actorId?: number;
  action?: string;
  entityType?: string;
  limit?: number;
}

export const fetchAudit = {
  /** GET /audit?actor_id=&action=&entity_type=&limit= — ADMIN only */
  list: async (params?: AuditListParams): Promise<AuditEntryApi[]> => {
    const response = await apiService.get<AuditEntryApi[]>("api/v1/audit", {
      actor_id: params?.actorId,
      action: params?.action,
      entity_type: params?.entityType,
      limit: params?.limit,
    });
    return response.data;
  },
};
