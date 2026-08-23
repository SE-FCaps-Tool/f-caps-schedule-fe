import apiService from "../core";
import type { UserRole } from "@/lib/types/roles";

export interface AccountApiItem {
  id: number;
  email: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  /** Account có nhiều role trong DB sẽ chỉ trả role đầu tiên theo thứ tự ưu tiên cố định của backend */
  role: UserRole;
}

export interface AccountCreatePayload {
  email: string;
  display_name: string;
  password: string;
  role: UserRole;
}

export interface AccountCreateResponse {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  status: "ACTIVE";
}

export interface AccountStatusPayload {
  status: "ACTIVE" | "INACTIVE";
  reason: string;
}

export interface AccountRolePayload {
  role: UserRole;
  reason: string;
}

export const fetchAccounts = {
  /** GET /accounts — ADMIN only */
  list: async (): Promise<AccountApiItem[]> => {
    const response = await apiService.get<AccountApiItem[]>("api/v1/accounts");
    return response.data;
  },

  /** POST /accounts */
  create: async (payload: AccountCreatePayload): Promise<AccountCreateResponse> => {
    const response = await apiService.post<AccountCreateResponse, AccountCreatePayload>("api/v1/accounts", payload);
    return response.data;
  },

  /** PATCH /accounts/{account_id}/status */
  updateStatus: async (accountId: number, payload: AccountStatusPayload): Promise<{ id: number; status: string }> => {
    const response = await apiService.patch<{ id: number; status: string }, AccountStatusPayload>(
      `api/v1/accounts/${accountId}/status`,
      payload
    );
    return response.data;
  },

  /** POST /accounts/{account_id}/roles */
  assignRole: async (accountId: number, payload: AccountRolePayload): Promise<{ id: number; role: UserRole }> => {
    const response = await apiService.post<{ id: number; role: UserRole }, AccountRolePayload>(
      `api/v1/accounts/${accountId}/roles`,
      payload
    );
    return response.data;
  },

  /** DELETE /accounts/{account_id}/roles/{role}?reason=... — reason là query param, không phải body */
  removeRole: async (accountId: number, role: UserRole, reason: string): Promise<{ id: number; role: UserRole; status: string }> => {
    const response = await apiService.delete<{ id: number; role: UserRole; status: string }>(
      `api/v1/accounts/${accountId}/roles/${role}?reason=${encodeURIComponent(reason)}`
    );
    return response.data;
  },
};
