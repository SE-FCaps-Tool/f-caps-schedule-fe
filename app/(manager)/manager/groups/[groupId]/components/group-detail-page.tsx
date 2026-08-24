"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  RefreshCw,
  ShieldAlert,
  UsersRound,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatInVietnamTime } from "@/lib/utils/formatDate";
import { useGroupOverview } from "@/hooks/manager/useGroups";
import type { GroupOverview } from "@/lib/api/services/fetchGroups";
import type { StatusTone } from "../../../_shared/status-dot";
import { StatusDot } from "../../../_shared/status-dot";
import {
  GROUP_STATUS_META,
  PROJECT_STATUS_META,
  REMEDIATION_STATUS_META,
  ROUND_STATUS_META,
  ROUND_TYPE_LABEL,
} from "../../../_shared/labels";

const GROUP_STATUS_LABELS = Object.fromEntries(Object.entries(GROUP_STATUS_META).map(([key, meta]) => [key, meta.label]));
const PROJECT_STATUS_LABELS = Object.fromEntries(Object.entries(PROJECT_STATUS_META).map(([key, meta]) => [key, meta.label]));
const REMEDIATION_STATUS_LABELS = Object.fromEntries(Object.entries(REMEDIATION_STATUS_META).map(([key, meta]) => [key, meta.label]));
const ROUND_STATUS_LABELS = Object.fromEntries(Object.entries(ROUND_STATUS_META).map(([key, meta]) => [key, meta.label]));

const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  orange: "bg-orange-50 text-orange-800",
  red: "bg-red-50 text-red-700",
  sky: "bg-sky-50 text-sky-800",
  violet: "bg-violet-50 text-violet-800",
};

function readableStatus(value: string, labels: Record<string, string> = {}) {
  const normalized = value.toUpperCase();
  return {
    label: labels[normalized] ?? normalized.replaceAll("_", " ").toLowerCase(),
    tone:
      GROUP_STATUS_META[normalized as keyof typeof GROUP_STATUS_META]?.tone ??
      PROJECT_STATUS_META[normalized as keyof typeof PROJECT_STATUS_META]?.tone ??
      REMEDIATION_STATUS_META[normalized as keyof typeof REMEDIATION_STATUS_META]?.tone ??
      ROUND_STATUS_META[normalized as keyof typeof ROUND_STATUS_META]?.tone ??
      ("neutral" as StatusTone),
  };
}

function roundLabel(value: string) {
  return ROUND_TYPE_LABEL[value as keyof typeof ROUND_TYPE_LABEL] ?? value.replaceAll("_", " ");
}

function formatDateTime(value: string | null) {
  return value ? formatInVietnamTime(value, "DD/MM/YYYY HH:mm") : "Chưa có lịch";
}

function StatusChip({ value, labels }: { value: string; labels?: Record<string, string> }) {
  const meta = readableStatus(value, labels);
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", TONE_BADGE_CLASS[meta.tone])}>{meta.label}</span>;
}

function DetailSection({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  action,
  children,
}: {
  icon: typeof GraduationCap;
  title: string;
  description?: string;
  tone?: "neutral" | "sky" | "violet" | "emerald" | "amber";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const iconTone = {
    neutral: "bg-muted text-muted-foreground",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  }[tone];

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconTone)} aria-hidden>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function GroupSummary({ data }: { data: GroupOverview }) {
  const groupStatus = GROUP_STATUS_META[data.status as keyof typeof GROUP_STATUS_META] ?? readableStatus(data.status);
  const projectStatus = data.project
    ? PROJECT_STATUS_META[data.project.status as keyof typeof PROJECT_STATUS_META] ?? readableStatus(data.project.status)
    : null;
  const statusSurface = {
    neutral: "border-border bg-muted/40 text-muted-foreground",
    emerald: "border-emerald-200 bg-emerald-50/65 text-emerald-900",
    amber: "border-amber-200 bg-amber-50/65 text-amber-900",
    orange: "border-orange-200 bg-orange-50/65 text-orange-900",
    red: "border-red-200 bg-red-50/65 text-red-900",
    sky: "border-sky-200 bg-sky-50/65 text-sky-900",
    violet: "border-violet-200 bg-violet-50/65 text-violet-900",
  }[groupStatus.tone];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-sky-200 bg-sky-50/65 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-sky-900">
          <UsersRound className="size-4" /> Thành viên
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums text-sky-950">{data.memberCount}</p>
        <p className="mt-1 text-xs text-sky-900/70">đang hoạt động</p>
      </div>
      <div className="rounded-xl border border-violet-200 bg-violet-50/65 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-violet-900">
          <FileText className="size-4" /> Đề tài
        </div>
        <p className="mt-3 truncate text-lg font-semibold text-violet-950">{data.project?.code ?? "Chưa gắn"}</p>
        <p className="mt-1 text-xs text-violet-900/70">{projectStatus?.label ?? "Chưa có đề tài"}</p>
      </div>
      <div className={cn("rounded-xl border p-4", statusSurface)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="size-4" /> Trạng thái nhóm
        </div>
        <div className="mt-3"><StatusDot tone={groupStatus.tone} label={groupStatus.label} /></div>
        <p className="mt-1 text-xs opacity-70">{data.warnings.length > 0 ? `${data.warnings.length} cảnh báo cần xử lý` : "Không có cảnh báo"}</p>
      </div>
    </div>
  );
}

function ProjectSection({ data }: { data: GroupOverview }) {
  return (
    <DetailSection
      icon={GraduationCap}
      title="Đề tài & hướng dẫn"
      description="Thông tin học thuật của nhóm"
      tone="violet"
      action={data.project ? <StatusChip value={data.project.status} labels={PROJECT_STATUS_LABELS} /> : undefined}
    >
      {data.project ? (
        <div className="space-y-4">
          <div className="border-b border-border pb-4">
            <p className="font-mono text-xs text-muted-foreground">{data.project.code}</p>
            <p className="mt-1 font-semibold leading-6">{data.project.name}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Hướng dẫn chính</dt>
              <dd className="mt-1 text-sm font-medium">{data.project.mainSupervisor?.fullName ?? "Chưa có"}</dd>
              {data.project.mainSupervisor?.code && <dd className="mt-0.5 text-xs text-muted-foreground">{data.project.mainSupervisor.code}</dd>}
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Đồng hướng dẫn</dt>
              <dd className="mt-1 text-sm font-medium">{data.project.coSupervisor?.fullName ?? "Chưa có"}</dd>
              {data.project.coSupervisor?.code && <dd className="mt-0.5 text-xs text-muted-foreground">{data.project.coSupervisor.code}</dd>}
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">Nhóm chưa được gắn đề tài.</div>
      )}
    </DetailSection>
  );
}

function MembersSection({ data }: { data: GroupOverview }) {
  return (
    <DetailSection icon={UsersRound} title="Thành viên" description={`${data.memberCount} thành viên đang hoạt động`} tone="sky">
      <div className="divide-y divide-border rounded-lg border border-border">
        {data.members.map((member) => (
          <div key={member.membershipId} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium">{member.studentCode}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{member.fullName || "Chưa có họ tên"}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusChip value={member.role} labels={{ LEADER: "Leader", MEMBER: "Thành viên" }} />
              {member.status === "LEFT" && <span className="text-xs text-muted-foreground">Đã rời nhóm</span>}
            </div>
          </div>
        ))}
        {data.members.length === 0 && <p className="p-4 text-sm text-muted-foreground">Chưa có thành viên.</p>}
      </div>
    </DetailSection>
  );
}

function ProgressSection({ data }: { data: GroupOverview }) {
  return (
    <DetailSection icon={CalendarClock} title="Tiến độ đánh giá" description="Theo dõi từng đợt và lịch đã xếp" tone="emerald">
      {data.progress.rounds.length > 0 ? (
        <div className="divide-y divide-border border-t border-border">
          {data.progress.rounds.map((round) => {
            return (
              <div key={round.roundId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{roundLabel(round.roundType)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />{formatDateTime(round.scheduledAt)}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{round.roomCode ? `Phòng ${round.roomCode}` : "Chưa có phòng"}</span>
                    </div>
                  </div>
                  <StatusChip value={round.roundStatus} labels={ROUND_STATUS_LABELS} />
                </div>
                <div className={cn("mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm", round.result ? "bg-emerald-50 text-emerald-900" : "bg-muted/60 text-muted-foreground")}>
                  {round.result ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <Clock3 className="size-4 shrink-0" />}
                  {round.result ? <span><strong className="font-semibold">{round.result.outcome}</strong>{round.result.note && <span className="ml-1.5">· {round.result.note}</span>}</span> : <span>Chưa có kết quả</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có đợt đánh giá nào.</p>
      )}
    </DetailSection>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>
    </div>
  );
}

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { data, isLoading, isError, refetch } = useGroupOverview(groupId);

  return (
    <div className="w-full">
      <Link href="/manager/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Nhóm sinh viên
      </Link>

      {isLoading && <div className="mt-5"><LoadingState /></div>}

      {isError && (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <WifiOff className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Không tải được chi tiết nhóm</p>
          <p className="mt-1 text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      )}

      {data && (
        <>
          <header className="mt-4 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-mono text-2xl font-semibold tracking-tight">{data.code}</h1>
                <StatusChip value={data.status} labels={GROUP_STATUS_LABELS} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {data.semester ? `${data.semester.code} · ${data.semester.name}` : "Chưa xác định học kỳ"}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <UsersRound className="size-4" />
              {data.memberCount} thành viên đang hoạt động
            </span>
          </header>

          {data.warnings.length > 0 && (
            <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-amber-700" /> Cần chú ý</div>
              <div className="mt-2 space-y-1 text-amber-900/80">{data.warnings.map((warning) => <p key={warning.code}>{warning.message}</p>)}</div>
            </section>
          )}

          <div className="mt-5"><GroupSummary data={data} /></div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-5">
              <ProjectSection data={data} />
              <MembersSection data={data} />
            </div>
            <div className="space-y-5">
              <ProgressSection data={data} />
              <DetailSection icon={FileText} title="Khắc phục" description="Các case cần theo dõi thêm" tone="amber">
                {data.remediation ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/65 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{roundLabel(data.remediation.roundType)}</p><StatusChip value={data.remediation.status} labels={REMEDIATION_STATUS_LABELS} /></div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-900/80"><Clock3 className="size-4" /> Hạn {formatDateTime(data.remediation.dueAt)}</p>
                    {data.remediation.note && <p className="mt-2 text-sm text-amber-950">{data.remediation.note}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có case khắc phục đang mở.</p>
                )}
              </DetailSection>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
