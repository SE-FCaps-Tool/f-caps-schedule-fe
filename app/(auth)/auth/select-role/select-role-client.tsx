"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, GraduationCap, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAuth } from "@/lib/api/services/fetchAuth";
import { authKeys } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_HOME } from "@/lib/types/roles";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { setCookie } from "cookies-next";
import { rememberAuthProfile } from "@/lib/utils/authProfile";
import type { ApiError } from "@/types/api";

const VALID_ROLES: UserRole[] = ["ADMIN", "MANAGER", "LECTURER", "STUDENT"];

function readRolesFromQuery(raw: string | null): UserRole[] {
  if (!raw) return [];
  return raw.split(",").filter((role): role is UserRole => VALID_ROLES.includes(role as UserRole));
}

const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  ADMIN: ShieldCheck,
  MANAGER: BriefcaseBusiness,
  LECTURER: GraduationCap,
  STUDENT: UserRound,
};

export default function SelectRoleClient({ rolesParam }: { rolesParam: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const redirected = useRef(false);
  const cachedRoles = useMemo(() => readRolesFromQuery(rolesParam), [rolesParam]);

  const roleMutation = useMutation({
    mutationFn: fetchAuth.selectRole,
    onSuccess: async (data) => {
      if (!data.role) {
        toast.error("Không xác định được vai trò đã chọn");
        return;
      }
      setCookie(
        SESSION_ROLE_COOKIE,
        data.role,
        getSecureCookieConfig({ maxAge: data.expiresAt ? Math.max(1, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)) : undefined })
      );
      rememberAuthProfile({ availableRoles: data.availableRoles });
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      toast.success("Đăng nhập thành công");
      router.replace(ROLE_HOME[data.role] ?? "/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không thể chọn vai trò");
    },
  });

  const roles = cachedRoles;
  const roleCards = useMemo(() => roles.map((role) => ({ role, Icon: ROLE_ICON[role] })), [roles]);

  useEffect(() => {
    if (cachedRoles.length > 1 || redirected.current) return;
    redirected.current = true;
    toast.error("Không có phiên chọn vai trò hợp lệ, vui lòng đăng nhập lại");
    router.replace("/login?oauth_error=role_selection_expired");
  }, [cachedRoles.length, router]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Chọn vai trò</CardTitle>
        <CardDescription>Tài khoản của bạn có nhiều vai trò. Chọn vai trò muốn sử dụng trong phiên này.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {roleCards.map(({ role, Icon }) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 rounded-xl p-4 text-left"
            disabled={roleMutation.isPending}
            onClick={() => roleMutation.mutate(role)}
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="flex flex-1 flex-col items-start gap-0.5">
              <span className="font-medium">{ROLE_LABEL_VI[role]}</span>
              <span className="text-xs font-normal text-muted-foreground">Truy cập khu vực {ROLE_HOME[role]}</span>
            </span>
            {roleMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
