"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { AlertTriangle, ChevronRight, WifiOff } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/admin/useAccounts";
import { useAudit } from "@/hooks/admin/useAudit";
import { actionLabel } from "../../audit-log/components/action-labels";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function AdminDashboard() {
  const reduceMotion = useReducedMotion();
  const { data: accounts, isLoading: accountsLoading, isError: accountsError } = useAccounts();
  const { data: recentActivity, isLoading: auditLoading } = useAudit({ limit: 6 });

  const activeCount = accounts?.filter((a) => a.status === "ACTIVE").length ?? 0;
  const inactiveCount = accounts ? accounts.length - activeCount : 0;
  const accountsById = new Map((accounts ?? []).map((a) => [a.id, a]));

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Quản trị hệ thống</h1>
        {accountsLoading && <Skeleton className="mt-2 h-5 w-72" />}
        {accountsError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được số liệu tài khoản.
          </div>
        )}
        {accounts && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-foreground">{accounts.length} tài khoản</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">{activeCount} đang hoạt động</span>
            {inactiveCount > 0 && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {inactiveCount} đang bị khóa
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {inactiveCount > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Cần chú ý</h2>
          <div className="mt-3">
            <Link
              href="/admin/accounts"
              className="flex items-center gap-3 border-t border-b border-border py-3.5 transition-colors hover:bg-muted/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {inactiveCount} tài khoản đang bị khóa
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Kiểm tra lý do khóa trước khi phân công cho kỳ mới.</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Hoạt động gần đây</h2>
          <Link href="/admin/audit-log" className="text-xs font-medium text-primary hover:underline">
            Xem tất cả audit log
          </Link>
        </div>

        {auditLoading && (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {recentActivity && recentActivity.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Chưa có hoạt động nào được ghi nhận.</p>
        )}

        {recentActivity && recentActivity.length > 0 && (
          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="mt-3"
          >
            {recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                variants={reduceMotion ? undefined : itemVariants}
                className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm first:border-t last:border-b-0"
              >
                <p className="min-w-0 truncate">
                  <span className="font-medium text-foreground">
                    {accountsById.get(activity.actorId)?.displayName ?? `Tài khoản #${activity.actorId}`}
                  </span>{" "}
                  <span className="text-muted-foreground">{actionLabel(activity.action)}</span>
                </p>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatDate(activity.occurredAt, "DD/MM HH:mm")}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
