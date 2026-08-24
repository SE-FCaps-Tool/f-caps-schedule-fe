"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/hooks/useAuth";
import { ROLE_HOME } from "@/lib/types/roles";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { setCookie } from "cookies-next";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (handled.current || isLoading) return;
    handled.current = true;
    if (isError || !user) {
      toast.error("Không thể hoàn tất đăng nhập Google");
      router.replace("/login?oauth_error=callback_failed");
      return;
    }
    setCookie(SESSION_ROLE_COOKIE, user.role, getSecureCookieConfig());
    toast.success("Đăng nhập thành công");
    router.replace(ROLE_HOME[user.role] ?? "/login");
  }, [isError, isLoading, router, user]);

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      Đang hoàn tất đăng nhập...
    </div>
  );
}
