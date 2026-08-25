"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  GraduationCap,
  Hash,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  UsersRound,
  WifiOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatInVietnamTime } from "@/lib/utils/formatDate";
import { useGroupOverview } from "@/hooks/manager/useGroups";
import type { GroupOverview } from "@/lib/api/services/fetchGroups";
import type { StatusTone } from "../../../_shared/status-dot";
import {
  GROUP_STATUS_META,
  PROJECT_STATUS_META,
  ROUND_STATUS_META,
  ROUND_TYPE_LABEL,
} from "../../../_shared/labels";

const GROUP_STATUS_LABELS = Object.fromEntries(Object.entries(GROUP_STATUS_META).map(([key, meta]) => [key, meta.label]));
const EXTRA_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  PENDING_D11: { label: "Đang đánh giá đợt Defense 1.1", tone: "sky" },
  PENDING_D12: { label: "Đang đánh giá đợt Defense 1.2", tone: "violet" },
  PENDING_D2: { label: "Đang đánh giá đợt Defense 2", tone: "orange" },
};

const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
};

type TimelineState = "done" | "current" | "upcoming";
type EvaluationResult = "PASS" | "FAIL" | "NEEDS_FIX" | "IN_PROGRESS" | "UPCOMING";

interface TimelineEntry {
  id: string;
  label: string;
  date: string;
  state: TimelineState;
  resultStatus: EvaluationResult;
  detail: string;
  reviewers: string;
  room?: string;
}

const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: "review-1",
    label: "Review 1",
    date: "18/09/2025",
    state: "done",
    resultStatus: "PASS",
    detail: "Đề cương rõ ràng, phạm vi phù hợp. Cần bổ sung tiêu chí đo lường cho phần kiểm thử.",
    reviewers: "Nguyễn Văn An · Trần Thị Mai",
    room: "A-301",
  },
  {
    id: "review-2",
    label: "Review 2",
    date: "30/10/2025",
    state: "done",
    resultStatus: "NEEDS_FIX",
    detail: "Sản phẩm đã có luồng chính. Nhóm cần hoàn thiện tài liệu triển khai trước Defense 1.1.",
    reviewers: "Lê Minh Khôi · Phạm Ngọc Hà",
    room: "A-205",
  },
  {
    id: "defense-11",
    label: "Defense 1.1",
    date: "14/11/2025",
    state: "current",
    resultStatus: "IN_PROGRESS",
    detail: "Mốc hiện tại. Hội đồng sẽ tập trung vào bản chạy thử, kiến trúc và khả năng đáp ứng yêu cầu.",
    reviewers: "Chưa phân công hội đồng",
    room: "Chưa xếp phòng",
  },
  {
    id: "defense-2",
    label: "Defense 2",
    date: "08/01/2026",
    state: "upcoming",
    resultStatus: "UPCOMING",
    detail: "Mốc bảo vệ cuối kỳ, sẽ mở sau khi hoàn tất Defense 1.1 và các yêu cầu khắc phục.",
    reviewers: "Chưa phân công hội đồng",
    room: "Chưa xếp phòng",
  },
];

function readableStatus(value: string, labels: Record<string, string> = {}) {
  const normalized = value.toUpperCase();
  return {
    label: labels[normalized] ?? EXTRA_STATUS_META[normalized]?.label ?? normalized.replaceAll("_", " ").toLowerCase(),
    tone:
      GROUP_STATUS_META[normalized as keyof typeof GROUP_STATUS_META]?.tone ??
      PROJECT_STATUS_META[normalized as keyof typeof PROJECT_STATUS_META]?.tone ??
      EXTRA_STATUS_META[normalized]?.tone ??
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
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", TONE_BADGE_CLASS[meta.tone])}>{meta.label}</span>;
}

const EVALUATION_RESULT_META: Record<EvaluationResult, { label: string; tone: StatusTone }> = {
  PASS: { label: "Đạt yêu cầu", tone: "emerald" },
  FAIL: { label: "Không đạt yêu cầu", tone: "red" },
  NEEDS_FIX: { label: "Cần sửa", tone: "amber" },
  IN_PROGRESS: { label: "Đang đánh giá", tone: "sky" },
  UPCOMING: { label: "Sắp tới", tone: "violet" },
};

function EvaluationStatusChip({ status }: { status: EvaluationResult }) {
  const meta = EVALUATION_RESULT_META[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", TONE_BADGE_CLASS[meta.tone])}>{meta.label}</span>;
}

const TIMELINE_STATE_META: Record<TimelineState, { label: string; tone: StatusTone }> = {
  done: { label: "Đã hoàn thành", tone: "emerald" },
  current: { label: "Đang thực hiện", tone: "orange" },
  upcoming: { label: "Sắp tới", tone: "neutral" },
};

function TimelineStateChip({ state }: { state: TimelineState }) {
  const meta = TIMELINE_STATE_META[state];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", TONE_BADGE_CLASS[meta.tone])}>{meta.label}</span>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof GraduationCap; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5 sm:p-6", className)}>{children}</section>;
}

function Initials({ name }: { name: string }) {
  const value = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">{value || "?"}</span>;
}

function isLeaderWarning(warning: GroupOverview["warnings"][number]) {
  return warning.code.toUpperCase().includes("LEADER") || warning.message.toLowerCase().includes("active leader");
}

function ProjectHeader({ data }: { data: GroupOverview }) {
  const project = data.project;
  const nameVi = project?.nameVi?.trim() || "Chưa cập nhật tên tiếng Việt";
  const nameEn = project?.nameEn?.trim() || project?.name?.trim() || "Chưa cập nhật tên tiếng Anh";
  const hasNameVi = Boolean(project?.nameVi?.trim());
  const hasNameEn = Boolean(project?.nameEn?.trim() || project?.name?.trim());
  const groupStatusLabel = readableStatus(data.status, GROUP_STATUS_LABELS).label;
  const supervisorSlots = [
    { label: "GVHD 1", name: project?.mainSupervisor?.fullName || "Không có" },
    { label: "GVHD 2", name: project?.coSupervisor?.fullName || "Không có" },
  ];

  return (
    <header className="mt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Nhóm {data.code}</p>
        <div className="ml-auto flex flex-wrap items-center gap-2" aria-label="Trạng thái">
          <span title={`Trạng thái nhóm: ${groupStatusLabel}`} aria-label={`Trạng thái nhóm: ${groupStatusLabel}`}><StatusChip value={data.status} labels={GROUP_STATUS_LABELS} /></span>
        </div>
      </div>
      {project ? (
        <div className="mt-5 w-full">
          <h1 className={cn("w-full text-balance text-xl font-semibold leading-tight tracking-tight sm:text-2xl", hasNameEn ? "text-foreground" : "text-muted-foreground")}>{nameEn}</h1>
          <p className={cn("mt-2 text-sm leading-6", hasNameVi ? "font-medium text-foreground/80" : "text-muted-foreground")}>{nameVi}</p>
        </div>
      ) : (
        <div className="mt-5">
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Chưa gắn đề tài</h1>
        </div>
      )}
      <dl className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/75 px-4 py-3.5"><dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-sky-800"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Hash className="size-4" /></span><span className="truncate">Mã đề tài</span></dt><dd className="ml-auto min-w-0 truncate text-right font-mono text-sm font-semibold text-sky-950">{project?.code ?? "—"}</dd></div>
        <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/75 px-4 py-3.5"><dt className="flex shrink-0 items-center gap-2 text-xs font-medium text-violet-800"><span className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><GraduationCap className="size-4" /></span>GVHD</dt><dd className="ml-auto flex min-w-0 items-center gap-2 text-right text-sm font-semibold"><span className={cn("min-w-0 truncate", supervisorSlots[0].name === "Không có" ? "italic text-violet-700/65" : "text-violet-950")} title={`GVHD 1: ${supervisorSlots[0].name}`}>{supervisorSlots[0].name}</span><span className="shrink-0 text-violet-400" aria-hidden>−</span><span className={cn("min-w-0 truncate", supervisorSlots[1].name === "Không có" ? "italic text-violet-700/65" : "text-violet-950")} title={`GVHD 2: ${supervisorSlots[1].name}`}>{supervisorSlots[1].name}</span></dd></div>
        <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/75 px-4 py-3.5"><dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-orange-800"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700"><UsersRound className="size-4" /></span><span className="truncate">Thành viên</span></dt><dd className="ml-auto text-xl font-semibold leading-6 text-orange-950">{data.memberCount}</dd></div>
      </dl>
    </header>
  );
}

function MembersPanel({ data }: { data: GroupOverview }) {
  const members = [...data.members].sort((a, b) => (a.role === "LEADER" ? -1 : b.role === "LEADER" ? 1 : 0));
  const leaderWarning = data.warnings.find(isLeaderWarning);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading icon={UsersRound} title="Danh sách thành viên" description={`${data.memberCount} thành viên · Leader hiển thị trước`} />
        {leaderWarning && (
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900" title={leaderWarning.message}>
            <AlertTriangle className="size-3.5 shrink-0 text-amber-700" />
            <span className="font-semibold">Cần chú ý</span>
            <span className="truncate text-amber-900/75">· {leaderWarning.message}</span>
          </div>
        )}
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-border"><div className="hidden grid-cols-[minmax(0,1fr)_120px_120px] gap-3 bg-muted/55 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid"><span>Sinh viên</span><span>Vai trò</span><span>Trạng thái</span></div><div className="divide-y divide-border">{members.map((member) => { const displayName = member.fullName || "Chưa có họ tên"; return <div key={member.membershipId} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_120px_120px] sm:items-center sm:gap-3"><div className="flex min-w-0 items-center gap-3"><Initials name={displayName} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{displayName}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{member.studentCode}</p></div></div><div><StatusChip value={member.role} labels={{ LEADER: "Leader", MEMBER: "Thành viên" }} /></div><div className="text-xs text-muted-foreground sm:text-sm">{member.status === "LEFT" ? "Đã rời nhóm" : "Đang hoạt động"}</div></div>; })}{members.length === 0 && <p className="p-4 text-sm text-muted-foreground">Chưa có thành viên.</p>}</div></div>
    </Panel>
  );
}

function InfoTab({ data }: { data: GroupOverview }) {
  return <MembersPanel data={data} />;
}

function stateFromRound(round: GroupOverview["progress"]["rounds"][number]): TimelineState {
  if (round.result) return "done";
  const status = round.roundStatus.toUpperCase();
  if (["OPEN", "IN_PROGRESS", "PUBLISHED", "SCHEDULED", "ONGOING"].includes(status) || round.scheduledAt) return "current";
  return "upcoming";
}

function evaluationResultFromOutcome(outcome: string | null, fallback: EvaluationResult): EvaluationResult {
  if (!outcome) return fallback;
  const normalized = outcome.toUpperCase();
  if (["FAIL", "FAILED", "REJECTED", "NOT_PASS"].some((value) => normalized.includes(value))) return "FAIL";
  if (["NEEDS_FIX", "CONDITIONAL", "REMEDIATION", "REWORK"].some((value) => normalized.includes(value))) return "NEEDS_FIX";
  return "PASS";
}

function actualTimeline(data: GroupOverview): TimelineEntry[] {
  if (data.progress.rounds.length === 0) return MOCK_TIMELINE;
  return data.progress.rounds.map((round, index) => {
    const detail = MOCK_TIMELINE[index] ?? MOCK_TIMELINE[MOCK_TIMELINE.length - 1];
    const state = stateFromRound(round);
    return {
      id: String(round.roundId),
      label: roundLabel(round.roundType),
      date: round.scheduledAt ? formatDateTime(round.scheduledAt) : "Chưa xếp lịch",
      state,
      resultStatus: evaluationResultFromOutcome(round.result?.outcome ?? null, state === "upcoming" ? "UPCOMING" : detail.resultStatus),
      detail: round.result?.note ?? detail.detail,
      reviewers: detail.reviewers,
      room: round.roomCode ? `Phòng ${round.roomCode}` : detail.room,
    };
  });
}

function TimelineMarker({ state }: { state: TimelineState }) {
  if (state === "done") return <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-background"><Check className="size-4" /></span>;
  if (state === "current") return <span className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-white ring-4 ring-background"><span className="size-2.5 rounded-full bg-white" /></span>;
  return <span className="flex size-8 items-center justify-center rounded-full border-2 border-border bg-card ring-4 ring-background"><span className="size-2 rounded-full bg-muted-foreground/40" /></span>;
}

function TimelineTab({ data }: { data: GroupOverview }) {
  const entries = actualTimeline(data);
  const current = entries.find((entry) => entry.state === "current") ?? entries[entries.length - 1];
  const currentIndex = Math.max(entries.findIndex((entry) => entry.id === current?.id), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50/55 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700"><Sparkles className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700">Mốc hiện tại</p><h2 className="mt-1 text-lg font-semibold text-orange-950">{current?.label ?? "Chưa xác định"}</h2><p className="mt-1 text-sm text-orange-900/75">{current?.detail ?? "Chưa có dữ liệu tiến độ."}</p></div></div><div className="shrink-0 text-left sm:text-right"><p className="text-2xl font-semibold tabular-nums text-orange-950">{currentIndex + 1}<span className="text-base font-normal text-orange-900/50"> / {entries.length}</span></p><p className="text-xs text-orange-900/70">mốc đã đi qua</p></div></div>
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3"><SectionHeading icon={CalendarDays} title="Timeline đánh giá" description="Theo dõi mốc thời gian và kết quả từng đợt" /><span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800"><Sparkles className="size-3.5" /> Bản xem trước · mockup</span></div>
        <ol className="relative mt-8 space-y-0 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-border sm:before:left-5">
          {entries.map((entry) => (
            <li key={entry.id} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-4 pb-8 last:pb-0 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-5">
              <div className="relative z-10"><TimelineMarker state={entry.state} /></div>
              <div className={cn("min-w-0 rounded-xl border p-4 transition-colors sm:p-5", entry.state === "current" ? "border-orange-200 bg-orange-50/40" : "border-border bg-card")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{entry.label}</h3>
                      <TimelineStateChip state={entry.state} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{entry.date}</span>
                      {entry.room && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{entry.room}</span>}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Kết quả</p>
                    <div className="mt-1"><EvaluationStatusChip status={entry.resultStatus} /></div>
                  </div>
                </div>
                <div className="mt-4 border-t border-border/80 pt-4">
                  <p className="text-xs text-muted-foreground">Nhận xét của hội đồng</p>
                  <p className="mt-1 text-sm leading-6 text-foreground/80">{entry.detail}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MessageSquareText className="size-3.5" /> Người đánh giá: {entry.reviewers}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function LoadingState() {
  return <div className="space-y-5"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-11 w-full rounded-lg" /><div className="space-y-5"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div></div>;
}

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { data, isLoading, isError, refetch } = useGroupOverview(groupId);

  return (
    <div className="w-full">
      <Link href="/manager/groups" className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Nhóm sinh viên</Link>
      {isLoading && <div className="mt-5"><LoadingState /></div>}
      {isError && <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center"><WifiOff className="size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Không tải được chi tiết nhóm</p><p className="mt-1 text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p><Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}><RefreshCw className="size-4" />Thử lại</Button></div>}
      {data && <><ProjectHeader data={data} /><Tabs defaultValue="info" className="mt-6"><TabsList variant="line" className="grid h-11 w-full grid-cols-2 gap-0 rounded-none border-b border-border p-0"><TabsTrigger value="info" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><FileText className="size-4" />Thông tin</TabsTrigger><TabsTrigger value="timeline" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><CalendarDays className="size-4" />Timeline</TabsTrigger></TabsList><TabsContent value="info" className="mt-5"><InfoTab data={data} /></TabsContent><TabsContent value="timeline" className="mt-5"><TimelineTab data={data} /></TabsContent></Tabs></>}
    </div>
  );
}
