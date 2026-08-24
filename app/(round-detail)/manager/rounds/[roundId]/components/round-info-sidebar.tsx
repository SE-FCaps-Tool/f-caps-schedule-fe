"use client";

import Link from "next/link";
import { CalendarClock, ChevronDown, PencilLine, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { RegistrationSummary, RoundDetail } from "@/lib/api/services/fetchRounds";

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-sm font-semibold tracking-tight">
      {children}
    </h2>
  );
}

function StatStack({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number | undefined;
  total: number | undefined;
  tone: "primary" | "emerald";
}) {
  const hasData = typeof value === "number" && typeof total === "number";
  const percentage = hasData && total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{hasData ? `${value} / ${total}` : "…"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", tone === "emerald" ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start gap-3 py-2.5">
      <dt className="min-w-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
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
  const invited = registrationSummary?.lecturers?.invited;
  const accepted = registrationSummary?.lecturers?.accepted;
  const availabilitySubmitted = registrationSummary?.lecturers?.availabilitySubmitted;
  const eligibleGroups = registrationSummary?.groups?.eligible;

  return (
    <div className="space-y-5">
      <section aria-labelledby="round-overview-title">
        <SectionTitle id="round-overview-title">Tổng quan</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <StatStack label="Thời lượng" value={`${round.durationMinutes} phút`} />
          <StatStack label="Reviewer / buổi" value={String(round.reviewerCount)} />
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-muted/45 px-3 py-2.5">
          <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Hạn đăng ký</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {round.registrationDeadline ? formatDate(round.registrationDeadline) : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 pt-5" aria-labelledby="registration-title">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle id="registration-title">Đăng ký</SectionTitle>
          <UsersRound className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="mt-3 space-y-4">
          <ProgressRow label="Giảng viên đã nhận lời" value={accepted} total={invited} tone="emerald" />
          <ProgressRow label="Lịch rảnh đã gửi" value={availabilitySubmitted} total={invited} tone="primary" />
        </div>
        <div
          className={cn(
            "mt-4 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
            eligibleGroups === 0 ? "bg-amber-500/10" : "bg-muted/45"
          )}
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Nhóm đủ điều kiện</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {eligibleGroups ?? "…"} <span className="font-normal text-muted-foreground">nhóm</span>
            </p>
          </div>
          {eligibleGroups === 0 && <StatusDot tone="amber" label="Cần xử lý" className="shrink-0 text-xs" />}
        </div>
      </section>

      <section className="border-t border-border/70 pt-5" aria-labelledby="config-title">
        <div className="flex items-center justify-between">
          <SectionTitle id="config-title">Cấu hình</SectionTitle>
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
        <dl className="mt-2 divide-y divide-border/50">
          <ConfigRow
            label="Khung thời gian"
            value={
              round.startDate && round.endDate
                ? `${formatDate(round.startDate, "DD/MM")} – ${formatDate(round.endDate, "DD/MM/YYYY")}`
                : "—"
            }
          />
          {round.timeframeId && (
            <ConfigRow
              label="Timeframe"
              value={`#${round.timeframeId} · revision #${round.timeframeVersionId ?? "—"}`}
            />
          )}
          <ConfigRow
            label="Giới hạn / slot"
            value={round.maxGroupsPerTimeslot === null ? "Không giới hạn" : round.maxGroupsPerTimeslot}
          />
          <ConfigRow label="Tự chọn lịch" value={<OnOffBadge on={round.groupSelectionMode} />} />
          <ConfigRow label="Result Owner" value={<OnOffBadge on={round.resultOwnerMode} />} />
        </dl>
      </section>

      <details className="group border-t border-border/70 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-semibold tracking-tight">Chú thích lịch</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>

        <div className="mt-4 space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground/70">Trên lịch</p>
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-orange-500/30 bg-orange-500/10" aria-hidden />}
            label="Giảng viên rảnh"
          />
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-violet-500/30 bg-violet-500/10" aria-hidden />}
            label="Nhóm đã chọn"
          />
          <LegendRow
            swatch={<span className="h-4 w-8 shrink-0 rounded-md border border-primary/20 bg-primary/5" aria-hidden />}
            label="Ngoài khung giờ round"
          />
          <LegendRow
            swatch={<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500" aria-hidden />}
            label="Hạn đăng ký chọn lịch"
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
          <p className="text-[11px] font-medium text-muted-foreground/70">Trạng thái</p>
          <StatusDot tone="amber" label="Đang chờ" className="text-xs" />
          <StatusDot tone="emerald" label="Hoàn tất / đủ điều kiện" className="text-xs" />
          <StatusDot tone="red" label="Từ chối / không đạt" className="text-xs" />
        </div>
      </details>
    </div>
  );
}
