"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { fetchAuth, type LoginPayload } from "@/lib/api/services/fetchAuth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { broadcastLogout } from "@/lib/utils/authChannel";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, ROLE_HOME, type UserRole } from "@/lib/types/roles";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import { clearStoredAuthProfile, readStoredAuthProfile, rememberAuthProfile } from "@/lib/utils/authProfile";
import type { ApiError } from "@/types/api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

function maxAgeFromExpiresAt(expiresAt: string | null): number | undefined {
  if (!expiresAt) return undefined;
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return undefined;
  const seconds = Math.floor((expiresMs - Date.now()) / 1000);
  return seconds > 0 ? seconds : undefined;
}

export function useMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchAuth.me,
    retry: false,
    staleTime: Infinity,
    enabled: options?.enabled,
  });
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shouldFetchMe, setShouldFetchMe] = useState(() =>
    typeof window !== "undefined" && Boolean(getCookie(SESSION_ROLE_COOKIE))
  );
  const [storedProfile, setStoredProfile] = useState(readStoredAuthProfile);
  const meQuery = useMe({ enabled: shouldFetchMe });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginPayload) => fetchAuth.login(credentials),
    onSuccess: async (data, credentials) => {
      rememberAuthProfile({
        email: data.email ?? credentials.email,
        displayName: data.displayName ?? null,
        availableRoles: data.availableRoles,
      });
      setStoredProfile(readStoredAuthProfile());

      if (data.requiresRoleSelection) {
        toast.success("Vui lòng chọn vai trò để tiếp tục");
        const roles = encodeURIComponent(data.availableRoles.join(","));
        router.replace(`/auth/select-role?roles=${roles}`);
        return;
      }
      if (!data.role) {
        toast.error("Tài khoản chưa có vai trò hợp lệ");
        return;
      }
      setCookie(
        SESSION_ROLE_COOKIE,
        data.role,
        getSecureCookieConfig({ maxAge: maxAgeFromExpiresAt(data.expiresAt) })
      );
      setShouldFetchMe(true);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      toast.success("Đăng nhập thành công");
      router.push(ROLE_HOME[data.role] ?? "/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Đăng nhập thất bại");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: fetchAuth.logout,
    onSuccess: async () => {
      setShouldFetchMe(false);
      deleteCookie(SESSION_ROLE_COOKIE, getSecureCookieConfig());
      clearStoredAuthProfile();
      setStoredProfile(null);
      // docs/auth.md: "FE nên reset toàn bộ cached user/query sau khi gọi" logout
      queryClient.clear();
      broadcastLogout();
      toast.success("Đăng xuất thành công");
      router.replace("/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Có lỗi xảy ra khi đăng xuất");
    },
  });

  const user = meQuery.data
    ? {
        ...meQuery.data,
        email: meQuery.data.email ?? storedProfile?.email ?? null,
        displayName: meQuery.data.displayName ?? storedProfile?.displayName ?? null,
      }
    : undefined;

  return {
    user,
    isLoadingUser: meQuery.isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === ROLE_ADMIN,
    isManager: user?.role === ROLE_MANAGER,
    isLecturer: user?.role === ROLE_LECTURER,
    isStudent: user?.role === ROLE_STUDENT,
    isLoading: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login: (credentials: LoginPayload) => loginMutation.mutateAsync(credentials),
    logout: () => logoutMutation.mutateAsync(),
  };
}

/** Multi-role accounts only: switch the active role without a full logout/login. */
export function useRoleSwitch() {
  const meQuery = useMe();
  const availableRoles = readStoredAuthProfile()?.availableRoles ?? [];
  // Fall back to the routing cookie while /me is still loading (or errored,
  // since useMe has retry: false) — without this, an unresolved current role
  // makes every stored role look like "another" role, including the one the
  // account is already on.
  const currentRole = meQuery.data?.role ?? (getCookie(SESSION_ROLE_COOKIE) as UserRole | undefined);
  const otherRoles = currentRole ? availableRoles.filter((role) => role !== currentRole) : [];

  const switchMutation = useMutation({
    mutationFn: (role: UserRole) => fetchAuth.selectRole(role),
    onSuccess: (data) => {
      if (!data.role) {
        toast.error("Không xác định được vai trò đã chọn");
        return;
      }
      setCookie(
        SESSION_ROLE_COOKIE,
        data.role,
        getSecureCookieConfig({ maxAge: maxAgeFromExpiresAt(data.expiresAt) })
      );
      rememberAuthProfile({ availableRoles: data.availableRoles });
      // Hard navigation, not router.replace + queryClient.clear(): the BE
      // revokes the old session as part of this call, so any in-flight
      // request still using the old cookie can land a 401 afterward and
      // trigger the global auto-logout handler (useAuthSyncAcrossTabs),
      // racing this redirect. A full page load tears the old page down
      // instead of leaving it able to fire further requests.
      window.location.assign(ROLE_HOME[data.role] ?? "/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không thể chuyển vai trò");
    },
  });

  return {
    otherRoles,
    isSwitching: switchMutation.isPending,
    switchRole: (role: UserRole) => switchMutation.mutate(role),
  };
}
