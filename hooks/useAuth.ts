"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { fetchAuth, type LoginPayload } from "@/lib/api/services/fetchAuth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { broadcastLogout } from "@/lib/utils/authChannel";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, ROLE_HOME } from "@/lib/types/roles";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import type { ApiError } from "@/types/api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

function maxAgeFromExpiresAt(expiresAt: string): number | undefined {
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
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shouldFetchMe, setShouldFetchMe] = useState(() =>
    typeof window !== "undefined" && Boolean(getCookie(SESSION_ROLE_COOKIE))
  );
  const meQuery = useMe({ enabled: shouldFetchMe });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginPayload) => fetchAuth.login(credentials),
    onSuccess: async (data) => {
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

  const user = meQuery.data;

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
