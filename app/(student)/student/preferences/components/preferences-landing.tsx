"use client";

import Link from "next/link";
import { ChevronRight, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/formatDate";
import { useLeaderDashboard } from "@/hooks/student/useLeaderPortal";
import { ROUND_TYPE_LABEL, PREFERENCE_STATUS_LABEL } from "../../_shared/labels";
import { StatusDot } from "../../_shared/status-dot";

export function PreferencesLanding() {
  const { data, isLoading, isError } = useLeaderDashboard();

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Đăng ký lịch</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chọn khung giờ ưu tiên cho nhóm ở đợt đang mở đăng ký.</p>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được thông tin đợt đánh giá. Thử tải lại trang.
          </div>
        )}
        {data && !data.currentRound && (
          <p className="py-10 text-center text-sm text-muted-foreground">Hiện chưa có đợt nào đang mở đăng ký.</p>
        )}
        {data && data.currentRound && data.preferenceStatus === "NOT_REQUIRED" && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Đợt {ROUND_TYPE_LABEL[data.currentRound.type]} không yêu cầu chọn nguyện vọng khung giờ.
          </p>
        )}
        {data && data.currentRound && data.preferenceStatus && data.preferenceStatus !== "NOT_REQUIRED" && (
          <Link
            href={`/student/preferences/${data.currentRound.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/40"
          >
            <div>
              <p className="text-sm font-semibold">{ROUND_TYPE_LABEL[data.currentRound.type]}</p>
              {data.deadline && (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  Hạn: {formatDate(data.deadline, "dddd, DD/MM/YYYY HH:mm")}
                </p>
              )}
              <div className="mt-1.5">
                <StatusDot
                  tone={data.preferenceStatus === "SUBMITTED" ? "emerald" : "amber"}
                  label={PREFERENCE_STATUS_LABEL[data.preferenceStatus]}
                  pulse={data.preferenceStatus === "PENDING"}
                />
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
      </div>
    </div>
  );
}
