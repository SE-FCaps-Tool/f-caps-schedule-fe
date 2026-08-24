import apiService from "../core";
import type { UserRole } from "@/lib/types/roles";

export interface LoginPayload {
  email: string;
  password: string;
}

// Shape đúng theo docs/auth.md — không có accessToken/refreshToken, session nằm ở HttpOnly cookie.
export interface LoginResponse {
  role: UserRole;
  expiresAt: string;
}

export interface LogoutResponse {
  status: string;
}

export interface MeResponse {
  role: UserRole;
  status: string;
  accountId: number;
}

export const fetchAuth = {
  /** Start the server-side Google OAuth flow. */
  googleLoginUrl: (): string => new URL("api/v1/auth/google/start", process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/").toString(),

  /**
   * POST /api/v1/auth/login
   */
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse, LoginPayload>("api/v1/auth/login", data);
    return response.data;
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
    const response = await apiService.get<MeResponse>("api/v1/auth/me");
    return response.data;
  },
};
