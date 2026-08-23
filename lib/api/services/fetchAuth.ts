import apiService from "../core";
import { normalizeToSnakeCase } from "../compat";
import type { UserRole } from "@/lib/types/roles";

export interface LoginPayload {
  email: string;
  password: string;
}

// Shape đúng theo docs/auth.md — không có accessToken/refreshToken, session nằm ở HttpOnly cookie.
export interface LoginResponse {
  role: UserRole;
  expires_at: string;
}

export interface LogoutResponse {
  status: string;
}

export interface MeResponse {
  role: UserRole;
  status: string;
  account_id: number;
}

export const fetchAuth = {
  /**
   * POST /api/v1/auth/login
   */
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const response = await apiService.post<unknown, LoginPayload>("api/v1/auth/login", data);
    return normalizeToSnakeCase<LoginResponse>(response.data);
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiService.post<LogoutResponse, undefined>("api/v1/auth/logout");
    return response.data;
  },

  /**
   * GET /api/v1/auth/me — nên gọi khi app khởi động, refresh trang, và sau 401 ở API khác.
   */
  me: async (): Promise<MeResponse> => {
    const response = await apiService.get<unknown>("api/v1/auth/me");
    return normalizeToSnakeCase<MeResponse>(response.data);
  },
};
