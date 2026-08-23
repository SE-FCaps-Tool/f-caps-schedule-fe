"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { PanelHeading } from "./round-detail-shared";
import type { RegistrationSummary, RoundDetail } from "@/lib/api/services/fetchRounds";

/** Section 1 — label phía trên, value nổi bật phía dưới, xếp lưới 2 cột cho gọn. */
function StatStack({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

/** Section 2/3 — 1 dòng, label trái, value phải, để scan nhanh. */
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {swatch}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function OnOffBadge({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        on ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
      )}
    >
      {on ? "Bật" : "Tắt"}
    </span>
  );
}

/** Cột trái — 4 khối gọn theo chiều dọc, ngăn cách bằng divider (không nested card). */
export function RoundInfoSidebar({
  round,
  registrationSummary,
}: {
  round: RoundDetail;
  registrationSummary: RegistrationSummary | undefined;
}) {
  const { currentSemesterId } = useSemesterContext();
  const canEditConfig = round.status === "DRAFT" || round.status === "OPEN_REGISTRATION";
  const editHref = `/manager/rounds/${round.id}/edit${currentSemesterId ? `?semester=${currentSemesterId}` : ""}`;

  return (
    <div className="space-y-4">
      <div>
        <PanelHeading>Tổng quan round</PanelHeading>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          <StatStack label="Thời lượng" value={`${round.durationMinutes} phút`} />
          <StatStack label="Reviewer / buổi" value={String(round.reviewerCount)} />
          <StatStack
            label="Nhóm đủ điều kiện"
            value={registrationSummary ? String(registrationSummary.groups?.eligible ?? "—") : "…"}
          />
          <StatStack
            label="Hạn đăng ký"
            value={round.registrationDeadline ? formatDate(round.registrationDeadline) : "—"}
          />
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <PanelHeading>Giảng viên</PanelHeading>
        <div className="space-y-1.5 pt-1">
          <StatRow label="Được mời" value={registrationSummary ? registrationSummary.lecturers?.invited : "…"} />
          <StatRow label="Đã chấp nhận" value={registrationSummary ? registrationSummary.lecturers?.accepted : "…"} />
          <StatRow
            label="Đã gửi lịch rảnh"
            value={registrationSummary ? registrationSummary.lecturers?.availabilitySubmitted : "…"}
          />
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <PanelHeading>Cấu hình</PanelHeading>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Chỉnh sửa cấu hình"
            title={canEditConfig ? "Chỉnh sửa cấu hình" : "Chỉ sửa được khi Round còn Nháp hoặc Đang mở đăng ký"}
            disabled={!canEditConfig}
            nativeButton={!canEditConfig}
            render={canEditConfig ? <Link href={editHref} /> : undefined}
          >
            <PencilLine />
          </Button>
        </div>
        <div className="space-y-1.5 pt-1">
          <StatRow
            label="Khoảng thời gian"
            value={
              round.startDate && round.endDate
                ? `${formatDate(round.startDate, "DD/MM")} – ${formatDate(round.endDate, "DD/MM/YYYY")}`
                : "—"
            }
          />
          {round.timeframeId && (
            <StatRow
              label="Timeframe"
              value={`#${round.timeframeId} · revision #${round.timeframeVersionId ?? "—"}`}
            />
          )}
          <StatRow label="Nhóm tối đa / slot" value={round.maxGroupsPerTimeslot} />
          <StatRow label="Nhóm tự chọn lịch" value={<OnOffBadge on={round.groupSelectionMode} />} />
          <StatRow label="Chỉ định Result Owner" value={<OnOffBadge on={round.resultOwnerMode} />} />
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <PanelHeading>Chú thích</PanelHeading>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground/70">Trên lịch</p>
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-orange-500/30 bg-orange-500/10" aria-hidden />}
            label="Thẻ giảng viên rảnh khung đó"
          />
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-violet-500/30 bg-violet-500/10" aria-hidden />}
            label="Thẻ nhóm đã chọn khung đó"
          />
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-primary/20 bg-primary/5" aria-hidden />}
            label="Không phải khung giờ của round"
          />
          <LegendRow
            swatch={<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500" aria-hidden />}
            label="Ngày hạn đăng ký chọn lịch"
          />
        </div>

        <div className="space-y-1.5 border-t border-border/60 pt-2.5">
          <p className="text-[11px] text-muted-foreground/70">Trạng thái</p>
          <StatusDot tone="amber" label="Đang chờ xử lý" />
          <StatusDot tone="emerald" label="Đã hoàn tất / đủ điều kiện" />
          <StatusDot tone="red" label="Từ chối / không đạt" />
        </div>
      </div>
    </div>
  );
}
