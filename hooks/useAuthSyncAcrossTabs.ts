"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { deleteCookie } from "cookies-next";
import { subscribeToLogout } from "@/lib/utils/authChannel";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";

/**
 * Đăng xuất khi: tab khác vừa logout (BroadcastChannel), hoặc bất kỳ API nào trả 401
 * (docs/auth.md: không retry vô hạn, chỉ hydrate lại một lần rồi chuyển về login).
 */
export function useAuthSyncAcrossTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    const signOut = () => {
      deleteCookie(SESSION_ROLE_COOKIE, { path: "/" });
      queryClient.clear();
      // Đã ở /login rồi thì thôi, tránh push lặp lại mỗi lần 401
      if (pathname !== "/login") router.push("/login");
    };

    const handleUnauthorized = () => signOut();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    const unsubscribe = subscribeToLogout(signOut);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      unsubscribe();
    };
  }, [router, pathname, queryClient]);
}
