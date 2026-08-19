"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTimeRange } from "@/lib/utils/formatDate";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderDashboard } from "@/hooks/student/useLeaderPortal";
import type { ReviewResult, DefenseResult } from "@/lib/api/services/fetchResults";
import {
  ROUND_TYPE_LABEL,
  ROUND_STATUS_LABEL,
  PROJECT_STATUS_META,
  REVIEW_RESULT_META,
  DEFENSE_RESULT_META,
  PREFERENCE_STATUS_LABEL,
} from "../../_shared/labels";
import { toneBadgeClass } from "../../_shared/status-dot";
import { CopyGroupCodeButton } from "./copy-group-code-button";
import { DetailRow } from "./detail-row";
import { RemediationBanner } from "./remediation-banner";

export function StudentDashboard() {
  const { data, isLoading, isError } = useLeaderDashboard();

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan nhóm</h1>
        {data?.group && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{data.group.code}</span>
            <CopyGroupCodeButton code={data.group.code} />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-6 max-w-xl space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <div className="mt-6 flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0" />
          Không tải được tổng quan nhóm. Thử tải lại trang.
        </div>
      )}

      {data && (
        <div className="mt-6 max-w-xl space-y-6">
          {data.project && (
            <div>
              <p className="text-sm text-foreground text-pretty">{data.project.titleVi}</p>
              {data.project.titleEn && (
                <p className="mt-0.5 text-sm text-muted-foreground italic text-pretty">{data.project.titleEn}</p>
              )}
            </div>
          )}

          <div>
            <DetailRow label="Đề tài" value={data.project ? data.project.code : "Chưa gắn đề tài"} />
            <DetailRow
              label="Trạng thái đề tài"
              value={
                data.project ? (
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[PROJECT_STATUS_META[data.project.status].tone])}>
                    {PROJECT_STATUS_META[data.project.status].label}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="GVHD chính" value={data.mainSupervisor?.name ?? "Chưa gán"} />
            <DetailRow label="Đồng hướng dẫn" value={data.coSupervisor?.name ?? "—"} />
            <DetailRow
              label="Số thành viên"
              value={data.group ? `${data.group.memberCount}/${data.group.maxMembers}` : "—"}
            />
          </div>

          <div>
            <DetailRow
              label="Đợt hiện tại"
              value={data.currentRound ? ROUND_TYPE_LABEL[data.currentRound.type] : "—"}
              hint={data.currentRound ? ROUND_STATUS_LABEL[data.currentRound.status] : undefined}
            />
            <DetailRow
              label="Nguyện vọng khung giờ"
              value={data.preferenceStatus ? PREFERENCE_STATUS_LABEL[data.preferenceStatus] : "—"}
              hint={
                data.preferenceStatus === "PENDING" && data.currentRound ? (
                  <Link href={`/student/preferences/${data.currentRound.id}`} className="text-primary hover:underline">
                    Chọn khung giờ →
                  </Link>
                ) : undefined
              }
            />
            <DetailRow
              label="Hạn đăng ký"
              value={data.deadline ? formatDate(data.deadline, "dddd, DD/MM/YYYY HH:mm") : "—"}
            />
            <DetailRow
              label="Phiên sắp tới"
              value={
                data.upcomingSession
                  ? `${formatDate(data.upcomingSession.date, "DD/MM")} · ${formatTimeRange(
                      `${data.upcomingSession.date}T${data.upcomingSession.startTime}:00`,
                      `${data.upcomingSession.date}T${data.upcomingSession.endTime}:00`
                    )}`
                  : "Chưa có lịch"
              }
              hint={data.upcomingSession?.room ? `Phòng ${data.upcomingSession.room}` : undefined}
            />
            <DetailRow
              label="Kết quả gần nhất"
              value={
                data.latestResult ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      toneBadgeClass[
                        data.latestResult.kind === "REVIEW"
                          ? REVIEW_RESULT_META[data.latestResult.value as ReviewResult].tone
                          : DEFENSE_RESULT_META[data.latestResult.value as DefenseResult].tone
                      ]
                    )}
                  >
                    {data.latestResult.kind === "REVIEW"
                      ? REVIEW_RESULT_META[data.latestResult.value as ReviewResult].label
                      : DEFENSE_RESULT_META[data.latestResult.value as DefenseResult].label}
                  </span>
                ) : (
                  "Chưa có kết quả"
                )
              }
              hint={data.latestResult ? ROUND_TYPE_LABEL[data.latestResult.roundType] : undefined}
            />
          </div>

          {data.remediation && <RemediationBanner remediation={data.remediation} />}
        </div>
      )}
    </div>
  );
}
