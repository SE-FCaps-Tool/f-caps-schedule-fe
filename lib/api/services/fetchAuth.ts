import apiService from "../core";
import type { UserRole } from "@/lib/types/roles";

export interface LoginPayload {
  email: string;
  password: string;
}

// Shape đúng theo docs/auth.md — không có accessToken/refreshToken, session nằm ở HttpOnly cookie.
export interface LoginResponse {
  role: UserRole | null;
  expiresAt: string | null;
  requiresRoleSelection: boolean;
  availableRoles: UserRole[];
  /** Optional identity fields returned by newer backend versions. */
  email?: string | null;
  displayName?: string | null;
}

export interface LogoutResponse {
  status: string;
}

export interface MeResponse {
  role: UserRole;
  status: string;
  accountId: number;
  /** Optional identity fields returned by newer backend versions. */
  email?: string | null;
  displayName?: string | null;
}

type AuthIdentityRecord = {
  email?: unknown;
  displayName?: unknown;
  fullName?: unknown;
  name?: unknown;
  display_name?: unknown;
  full_name?: unknown;
};

type RawMeResponse = MeResponse & AuthIdentityRecord & {
  account?: AuthIdentityRecord | null;
  profile?: AuthIdentityRecord | null;
  user?: AuthIdentityRecord | null;
};

function firstText(...values: unknown[]): string | null {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function normalizeMeResponse(data: RawMeResponse): MeResponse {
  const account = data.account ?? {};
  const profile = data.profile ?? {};
  const user = data.user ?? {};

  return {
    ...data,
    email: firstText(data.email, account.email, profile.email, user.email),
    displayName: firstText(
      data.displayName,
      data.fullName,
      data.name,
      data.display_name,
      data.full_name,
      account.displayName,
      account.fullName,
      account.name,
      account.display_name,
      account.full_name,
      profile.displayName,
      profile.fullName,
      profile.name,
      profile.display_name,
      profile.full_name,
      user.displayName,
      user.fullName,
      user.name,
      user.display_name,
      user.full_name
    ),
  };
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

  /** POST /api/v1/auth/select-role — consumes the pending login challenge. */
  selectRole: async (role: UserRole): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse, { role: UserRole }>("api/v1/auth/select-role", { role });
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
    const response = await apiService.get<RawMeResponse>("api/v1/auth/me");
    return normalizeMeResponse(response.data);
  },
};
