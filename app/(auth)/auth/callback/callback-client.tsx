"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setCookie } from "cookies-next";
import { fetchAuth } from "@/lib/api/services/fetchAuth";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { ROLE_HOME, type UserRole } from "@/lib/types/roles";

const VALID_ROLES: UserRole[] = ["ADMIN", "MANAGER", "LECTURER", "STUDENT"];

function parseRoles(raw: string | null): UserRole[] {
  if (!raw) return [];
  return raw.split(",").filter((role): role is UserRole => VALID_ROLES.includes(role as UserRole));
}

export default function GoogleAuthCallbackClient({ rolesParam }: { rolesParam: string | null }) {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const roles = parseRoles(rolesParam);

    if (roles.length > 1) {
      router.replace(`/auth/select-role?roles=${encodeURIComponent(roles.join(","))}`);
      return;
    }

    // A single-role Google login already created the server session. Resolve
    // the role from /me instead of asking /auth/pending for a non-existent
    // multi-role challenge.
    void fetchAuth.me()
      .then(({ role }) => {
        setCookie(SESSION_ROLE_COOKIE, role, getSecureCookieConfig());
        router.replace(ROLE_HOME[role] ?? "/login");
      })
      .catch(() => router.replace("/login?oauth_error=google_session_missing"));
  }, [rolesParam, router]);

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      Đang hoàn tất đăng nhập...
    </div>
  );
}
