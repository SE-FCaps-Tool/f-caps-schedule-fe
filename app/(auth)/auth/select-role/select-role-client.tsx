"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, GraduationCap, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAuth } from "@/lib/api/services/fetchAuth";
import type { UserRole } from "@/lib/types/roles";
import { ROLE_HOME } from "@/lib/types/roles";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";
import { getSecureCookieConfig } from "@/utils/cookieConfig";
import { setCookie } from "cookies-next";
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

function RoleSelectionLoading() {
  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      Đang tải các vai trò của tài khoản...
    </div>
  );
}

export default function SelectRoleClient({ rolesParam }: { rolesParam: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const redirected = useRef(false);
  const cachedRoles = useMemo(() => readRolesFromQuery(rolesParam), [rolesParam]);
  const rolesQuery = useQuery({
    queryKey: ["auth", "pending-role-selection"],
    queryFn: fetchAuth.pendingRoleSelection,
    retry: false,
    enabled: cachedRoles.length === 0,
    initialData: cachedRoles.length ? { availableRoles: cachedRoles } : undefined,
  });
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
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Đăng nhập thành công");
      router.replace(ROLE_HOME[data.role] ?? "/login");
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Không thể chọn vai trò");
    },
  });

  const roles = useMemo(() => cachedRoles.length ? cachedRoles : rolesQuery.data?.availableRoles ?? [], [cachedRoles, rolesQuery.data?.availableRoles]);
  const roleCards = useMemo(() => roles.map((role) => ({ role, Icon: ROLE_ICON[role] })), [roles]);

  useEffect(() => {
    if (!rolesQuery.isError || redirected.current) return;
    redirected.current = true;
    toast.error("Phiên chọn vai trò đã hết hạn, vui lòng đăng nhập lại");
    router.replace("/login?oauth_error=role_selection_expired");
  }, [rolesQuery.isError, router]);

  if (rolesQuery.isLoading) return <RoleSelectionLoading />;

  if (rolesQuery.isError) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Phiên chọn vai trò đã hết hạn</CardTitle>
          <CardDescription>Vui lòng đăng nhập lại để chọn vai trò.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
