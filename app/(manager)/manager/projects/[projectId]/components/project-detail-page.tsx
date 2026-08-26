"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardCheck, FileText, GraduationCap, Hash, UsersRound, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { StatusTone } from "../../../_shared/status-dot";
import {
  PROJECT_STATUS_META,
  getRoundResultMeta,
  ROUND_TYPE_LABEL,
  type ProjectProgressState,
} from "../../../_shared/labels";
import { useProjectDetail, useProjectProgression, useProjectResults } from "@/hooks/manager/useProjects";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";
import { topicTypeDescription, topicTypeLabel } from "@/lib/utils/masterDataLabels";

const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
};

function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", TONE_BADGE_CLASS[tone])}>{label}</span>;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5 sm:p-6", className)}>{children}</section>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description?: string }) {
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

function LoadingBlock() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function ErrorBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <WifiOff className="size-4 shrink-0" />
      {label}
    </div>
  );
}

function resultTone(round: string, result: string | null) {
  if (!result) return null;
  return getRoundResultMeta(round as Parameters<typeof getRoundResultMeta>[0], result) ?? null;
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { data: project, isLoading, isError } = useProjectDetail(projectId);
  const { data: progression, isLoading: progressionLoading, isError: progressionError } = useProjectProgression(projectId);
  const { data: results, isLoading: resultsLoading, isError: resultsError } = useProjectResults(projectId);

  if (isLoading) {
    return (
      <div>
        <Link href="/manager/projects" className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Đề tài
        </Link>
        <div className="mt-5 space-y-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return <ErrorBlock label="Không tải được đề tài. Thử tải lại trang." />;
  }

  const statusMeta = PROJECT_STATUS_META[project.status as ProjectProgressState] ?? PROJECT_STATUS_META.DRAFT;
  const nameVi = project.nameVi.trim() || "Chưa cập nhật tên tiếng Việt";
  const nameEn = project.nameEn?.trim() || "Chưa cập nhật tên tiếng Anh";

  return (
    <div className="w-full">
      <Link href="/manager/projects" className="inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Đề tài
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Đề tài {project.code}</p>
          <div className="ml-auto" aria-label="Trạng thái">
            <StatusChip label={statusMeta.label} tone={statusMeta.tone} />
          </div>
        </div>
        <div className="mt-5 w-full">
          <h1 className="w-full text-balance text-xl font-semibold leading-tight tracking-tight sm:text-2xl" title={project.nameVi}>{nameEn}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-foreground/80">{nameVi}</p>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/75 px-4 py-3.5">
            <dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-sky-800"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Hash className="size-4" /></span><span className="truncate">Mã đề tài</span></dt>
            <dd className="ml-auto min-w-0 truncate text-right font-mono text-sm font-semibold text-sky-950">{project.code}</dd>
          </div>
          <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/75 px-4 py-3.5">
            <dt className="flex shrink-0 items-center gap-2 text-xs font-medium text-violet-800"><span className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><GraduationCap className="size-4" /></span>GVHD</dt>
            <dd className="ml-auto flex min-w-0 items-center gap-2 text-right text-sm font-semibold"><span className={cn("min-w-0 truncate", project.mainSupervisor ? "text-violet-950" : "italic text-violet-700/65")} title={project.mainSupervisor?.fullName ?? "GVHD chính: Không có"}>{project.mainSupervisor?.fullName ?? "Không có"}</span><span className="shrink-0 text-violet-400" aria-hidden>·</span><span className={cn("min-w-0 truncate", project.coSupervisor ? "text-violet-950" : "italic text-violet-700/65")} title={project.coSupervisor?.fullName ?? "GVHD phụ: Không có"}>{project.coSupervisor?.fullName ?? "Không có"}</span></dd>
          </div>
          <div className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/75 px-4 py-3.5">
            <dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-orange-800"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700"><UsersRound className="size-4" /></span><span className="truncate">Nhóm</span></dt>
            <dd className="ml-auto min-w-0 truncate text-right text-sm font-semibold text-orange-950">{project.group ? <Link href={`/manager/groups/${project.group.id}`} className="hover:underline">{project.group.code}</Link> : <span className="italic text-orange-700/65">Chưa gắn</span>}</dd>
          </div>
        </dl>
      </header>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList variant="line" className="grid h-11 w-full grid-cols-4 gap-0 rounded-none border-b border-border p-0">
          <TabsTrigger value="overview" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><FileText className="size-4" />Tổng quan</TabsTrigger>
          <TabsTrigger value="group" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><UsersRound className="size-4" />Nhóm</TabsTrigger>
          <TabsTrigger value="progression" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><CalendarDays className="size-4" />Tiến độ</TabsTrigger>
          <TabsTrigger value="results" className="min-w-0 flex-1 rounded-none border-0 px-3 py-2.5 data-active:font-semibold after:bottom-0 after:z-10 after:bg-primary"><ClipboardCheck className="size-4" />Kết quả</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <Panel>
            <SectionHeading icon={FileText} title="Thông tin đề tài" description="Thông tin cơ bản và phân loại đề tài" />
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Tên tiếng Việt</dt><dd className="mt-1 text-sm font-medium">{nameVi}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Tên tiếng Anh</dt><dd className="mt-1 text-sm">{project.nameEn || "Chưa cập nhật"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Loại đề tài</dt><dd className="mt-1 text-sm font-medium">{topicTypeLabel(project.topicType)}</dd><p className="mt-0.5 text-xs text-muted-foreground">{topicTypeDescription(project.topicType)}</p></div>
              <div><dt className="text-xs text-muted-foreground">Trạng thái</dt><dd className="mt-1"><StatusChip label={statusMeta.label} tone={statusMeta.tone} /></dd></div>
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="group" className="mt-5">
          <Panel>
            <SectionHeading icon={UsersRound} title="Nhóm sinh viên" description="Nhóm đang thực hiện đề tài này" />
            {project.group ? <dl className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Nhóm</dt><dd className="mt-1 font-mono text-sm font-medium"><Link href={`/manager/groups/${project.group.id}`} className="hover:underline">{project.group.code}</Link></dd></div><div><dt className="text-xs text-muted-foreground">Leader</dt><dd className="mt-1 text-sm">{project.group.leader?.fullName ?? "Chưa có"}</dd></div><div><dt className="text-xs text-muted-foreground">Số thành viên</dt><dd className="mt-1 text-sm tabular-nums">{project.group.memberCount}</dd></div></dl> : <p className="mt-5 text-sm text-muted-foreground">Đề tài chưa được gắn cho nhóm nào.</p>}
          </Panel>
        </TabsContent>

        <TabsContent value="progression" className="mt-5">
          <Panel>
            <SectionHeading icon={CalendarDays} title="Timeline đánh giá" description="Theo dõi các mốc đánh giá của đề tài" />
            {progressionLoading && <div className="mt-5"><LoadingBlock /></div>}
            {progressionError && <ErrorBlock label="Không tải được tiến độ." />}
            {progression && (
            <div className="mt-5 space-y-4">
              <ol className="space-y-3 border-l border-border pl-4">
                {progression.timeline.map((entry, index) => {
                  const meta = resultTone(entry.round, entry.result);
                  return (
                    <li key={index} className="relative">
                      <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-border" />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{ROUND_TYPE_LABEL[entry.round]}</span>
                        {meta ? (
                          <StatusChip tone={meta.tone} label={meta.label} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa có kết quả</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {progression.remediation && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Đang khắc phục (Remediation)</p>
                  <p className="mt-1 text-amber-700 dark:text-amber-400">
                    Hạn: {formatDate(progression.remediation.deadline)} · Trạng thái: {progression.remediation.status}
                  </p>
                </div>
              )}
            </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="results" className="mt-5">
          <Panel>
            <SectionHeading icon={ClipboardCheck} title="Kết quả đánh giá" description="Kết quả đã được ghi nhận theo từng đợt" />
            {resultsLoading && <div className="mt-5"><LoadingBlock /></div>}
            {resultsError && <ErrorBlock label="Không tải được kết quả." />}
            {results && results.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Chưa có kết quả nào được ghi cho đề tài này.</p>}
            {results && results.length > 0 && (
            <div className="mt-5 space-y-2">
              {results.map((r) => {
                const meta = resultTone(r.round, r.result);
                return (
                  <div key={r.sessionId} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{ROUND_TYPE_LABEL[r.round]}</p>
                      {r.note && <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.submittedAt)}</span>
                      {meta && <StatusChip tone={meta.tone} label={meta.label} />}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
