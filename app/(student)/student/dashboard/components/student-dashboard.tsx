"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatTimeRange } from "@/lib/utils/formatDate";
import { useLeaderDashboard } from "@/hooks/student/useLeaderPortal";
import type { LeaderDashboard } from "@/lib/api/services/fetchLeaderPortal";
import {
  getRoundResultMeta,
  PREFERENCE_STATUS_LABEL,
  PROJECT_STATUS_META,
  ROUND_STATUS_LABEL,
  ROUND_TYPE_LABEL,
} from "../../_shared/labels";
import { StatusDot, toneBadgeClass } from "../../_shared/status-dot";
import { CopyGroupCodeButton } from "./copy-group-code-button";
import { RemediationBanner } from "./remediation-banner";

function roundLabel(round: NonNullable<LeaderDashboard["currentRound"]>) {
  return round.name?.trim() || ROUND_TYPE_LABEL[round.type];
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GraduationCap;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function InfoItem({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-border pt-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function NextAction({ data }: { data: LeaderDashboard }) {
  const round = data.currentRound;

  if (!round) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <SectionHeading icon={CalendarCheck} title="Đợt đánh giá hiện tại" description="Chưa có đợt nào cần nhóm thực hiện." />
        <div className="mt-5 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          Khi bộ môn mở đợt đánh giá mới, các bước cần làm của nhóm sẽ xuất hiện tại đây.
        </div>
      </section>
    );
  }

  const isPending = data.preferenceStatus === "PENDING";
  const isSubmitted = data.preferenceStatus === "SUBMITTED";
  const tone = isPending ? "amber" : isSubmitted ? "emerald" : "neutral";

  return (
    <section
      className={cn(
        "rounded-xl border p-5 sm:p-6",
        isPending && "border-amber-200 bg-amber-50/65",
        isSubmitted && "border-emerald-200 bg-emerald-50/55",
        !isPending && !isSubmitted && "border-border bg-card"
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              isPending ? "bg-amber-100 text-amber-700" : isSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}
            aria-hidden
          >
            {isPending ? <Clock3 className="size-5" /> : <CalendarCheck className="size-5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Đợt hiện tại</p>
              <StatusDot
                tone={tone}
                label={data.preferenceStatus ? PREFERENCE_STATUS_LABEL[data.preferenceStatus] : ROUND_STATUS_LABEL[round.status]}
                pulse={isPending}
                className="text-xs"
              />
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{roundLabel(round)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPending
                ? "Nhóm cần chọn khung giờ ưu tiên để bộ môn xếp lịch."
                : isSubmitted
                  ? "Nguyện vọng khung giờ của nhóm đã được ghi nhận."
                  : "Đợt này không yêu cầu nhóm chọn nguyện vọng khung giờ."}
            </p>
          </div>
        </div>

        {isPending && (
          <Button nativeButton={false} render={<Link href={`/student/preferences/${round.id}`} />} className="w-full sm:w-auto">
            Chọn khung giờ
            <ArrowUpRight className="size-4" />
          </Button>
        )}
      </div>

      {data.deadline && (
        <div className="mt-5 flex items-center gap-2 border-t border-current/10 pt-4 text-sm text-muted-foreground">
          <Clock3 className="size-4 shrink-0" />
          <span>Hạn đăng ký</span>
          <strong className="font-semibold text-foreground tabular-nums">{formatDate(data.deadline, "DD/MM/YYYY HH:mm")}</strong>
        </div>
      )}
    </section>
  );
}

function UpcomingSession({ data }: { data: LeaderDashboard }) {
  const session = data.upcomingSession;

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <SectionHeading icon={CalendarClock} title="Phiên sắp tới" description="Lịch gần nhất của nhóm" />
        <span className="hidden rounded-lg bg-primary/10 p-2 text-primary sm:flex" aria-hidden>
          <CalendarClock className="size-4" />
        </span>
      </div>

      {session ? (
        <div className="mt-5 flex items-start gap-3 border-t border-border pt-4">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-[11px] font-medium uppercase">{formatDate(session.date, "ddd")}</span>
            <span className="text-xl leading-6 font-semibold tabular-nums">{formatDate(session.date, "DD")}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{data.currentRound ? roundLabel(data.currentRound) : "Phiên đánh giá"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
              <Clock3 className="size-4 shrink-0" />
              {formatTimeRange(`${session.date}T${session.startTime}:00`, `${session.date}T${session.endTime}:00`)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {session.room ? `Phòng ${session.room}` : "Chưa xếp phòng"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          Nhóm chưa có phiên nào được xếp lịch.
        </div>
      )}

      <Button variant="outline" nativeButton={false} render={<Link href="/student/schedule" />} className="mt-5 w-full">
        Xem lịch nhóm
        <ArrowUpRight className="size-4" />
      </Button>
    </section>
  );
}

function GroupProjectOverview({ data }: { data: LeaderDashboard }) {
  const projectMeta = data.project ? PROJECT_STATUS_META[data.project.status] : null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <SectionHeading icon={GraduationCap} title="Nhóm & đề tài" description="Thông tin học tập của nhóm" />

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">Đề tài</p>
        {data.project ? (
          <>
            <p className="mt-1 font-semibold leading-6" title={data.project.titleVi}>
              {data.project.titleEn?.trim() || data.project.titleVi}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{data.project.code}</span>
              {projectMeta && (
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[projectMeta.tone])}>
                  {projectMeta.label}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Nhóm chưa được gắn đề tài.</p>
        )}
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <InfoItem label="GVHD chính" value={data.mainSupervisor?.name ?? "Chưa gán"} />
        <InfoItem label="Đồng hướng dẫn" value={data.coSupervisor?.name ?? "Chưa gán"} />
        <InfoItem
          label="Thành viên"
          value={data.group ? `${data.group.memberCount}/${data.group.maxMembers}` : "—"}
          hint="thành viên hiện tại / tối đa"
        />
        <InfoItem
          label="Mã nhóm"
          value={
            data.group ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-sm">
                {data.group.code}
                <CopyGroupCodeButton code={data.group.code} />
              </span>
            ) : (
              "Chưa có nhóm"
            )
          }
        />
      </div>
    </section>
  );
}

function ProgressOverview({ data }: { data: LeaderDashboard }) {
  const resultMeta = data.latestResult
    ? getRoundResultMeta(data.latestResult.roundType, data.latestResult.value)
    : null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <SectionHeading icon={CheckCircle2} title="Theo dõi tiến độ" description="Các mốc mới nhất của nhóm" />

      <div className="mt-5 divide-y divide-border border-t border-border">
        <div className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Trạng thái đợt hiện tại</p>
            <p className="mt-1 font-semibold">{data.currentRound ? roundLabel(data.currentRound) : "Chưa có đợt"}</p>
          </div>
          {data.currentRound && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {ROUND_STATUS_LABEL[data.currentRound.status]}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Kết quả gần nhất</p>
            <p className="mt-1 font-semibold">{data.latestResult ? ROUND_TYPE_LABEL[data.latestResult.roundType] : "Chưa có kết quả"}</p>
            {data.latestResult && <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(data.latestResult.date, "DD/MM/YYYY")}</p>}
          </div>
          {data.latestResult && (
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", resultMeta ? toneBadgeClass[resultMeta.tone] : toneBadgeClass.neutral)}>
              {resultMeta?.label ?? data.latestResult.value}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
      <div className="space-y-5">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function StudentDashboard() {
  const { data, isLoading, isError, refetch } = useLeaderDashboard();

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Tổng quan nhóm</h1>
            {data?.group && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
                {data.group.code}
                <CopyGroupCodeButton code={data.group.code} />
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Theo dõi đợt đánh giá, lịch nhóm và những việc cần hoàn tất.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/student/schedule" />} className="w-full sm:w-auto">
          <CalendarClock className="size-4" />
          Lịch nhóm
          <ArrowUpRight className="size-4" />
        </Button>
      </header>

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <WifiOff className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Không tải được tổng quan nhóm</p>
          <p className="mt-1 text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      )}

      {data && (
        <>
          {!data.group && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/65 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">Bạn chưa thuộc nhóm nào</p>
                <p className="mt-1 text-amber-900/75">Thông tin đợt đánh giá và lịch nhóm sẽ xuất hiện sau khi bạn được gán vào nhóm.</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <div className="space-y-5">
              <NextAction data={data} />
              <GroupProjectOverview data={data} />
            </div>
            <div className="space-y-5">
              <UpcomingSession data={data} />
              <ProgressOverview data={data} />
              {data.remediation && <RemediationBanner remediation={data.remediation} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
