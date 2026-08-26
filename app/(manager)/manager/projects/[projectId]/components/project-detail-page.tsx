"use client";

import Link from "next/link";
import { ChevronLeft, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusDot } from "../../../_shared/status-dot";
import {
  PROJECT_STATUS_META,
  getRoundResultMeta,
  ROUND_TYPE_LABEL,
  type ProjectProgressState,
} from "../../../_shared/labels";
import { useProjectDetail, useProjectProgression, useProjectResults } from "@/hooks/manager/useProjects";
import { formatDate, formatDateTime } from "@/lib/utils/formatDate";
import { topicTypeDescription, topicTypeLabel } from "@/lib/utils/masterDataLabels";

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
        <Link href="/manager/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          Đề tài
        </Link>
        <Skeleton className="mt-4 h-8 w-64" />
        <div className="mt-8">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return <ErrorBlock label="Không tải được đề tài. Thử tải lại trang." />;
  }

  const statusMeta = PROJECT_STATUS_META[project.status as ProjectProgressState];

  return (
    <div>
      <Link href="/manager/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" />
        Đề tài
      </Link>

      <div className="mt-2">
        <h1 className="text-2xl font-semibold tracking-tight" title={project.nameVi}>
          {project.nameEn?.trim() || project.nameVi}
        </h1>
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground">{project.code}</span>
          <span className="text-muted-foreground/50">·</span>
          <StatusDot tone={statusMeta.tone} label={statusMeta.label} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="group">Nhóm</TabsTrigger>
          <TabsTrigger value="progression">Tiến độ</TabsTrigger>
          <TabsTrigger value="results">Kết quả</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Mã đề tài</dt>
              <dd className="mt-1 font-mono text-sm font-medium">{project.code}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tên (Tiếng Anh)</dt>
              <dd className="mt-1 text-sm">{project.nameEn || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Loại đề tài</dt>
              <dd className="mt-1 text-sm font-medium">{topicTypeLabel(project.topicType)}</dd>
              <p className="mt-0.5 text-xs text-muted-foreground">{topicTypeDescription(project.topicType)}</p>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Trạng thái</dt>
              <dd className="mt-1">
                <StatusDot tone={statusMeta.tone} label={statusMeta.label} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">GVHD chính</dt>
              <dd className="mt-1 text-sm">{project.mainSupervisor?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Đồng hướng dẫn</dt>
              <dd className="mt-1 text-sm">{project.coSupervisor?.fullName ?? "—"}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="group" className="mt-5">
          {project.group ? (
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Nhóm</dt>
                <dd className="mt-1 font-mono text-sm font-medium">
                  <Link href={`/manager/groups`} className="hover:underline">
                    {project.group.code}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Leader</dt>
                <dd className="mt-1 text-sm">{project.group.leader?.fullName ?? "Chưa có"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Số thành viên</dt>
                <dd className="mt-1 text-sm tabular-nums">{project.group.memberCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Đề tài chưa được gắn cho nhóm nào.</p>
          )}
        </TabsContent>

        <TabsContent value="progression" className="mt-5">
          {progressionLoading && <LoadingBlock />}
          {progressionError && <ErrorBlock label="Không tải được tiến độ." />}
          {progression && (
            <div className="space-y-4">
              <ol className="space-y-3 border-l border-border pl-4">
                {progression.timeline.map((entry, index) => {
                  const meta = resultTone(entry.round, entry.result);
                  return (
                    <li key={index} className="relative">
                      <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-border" />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{ROUND_TYPE_LABEL[entry.round]}</span>
                        {meta ? (
                          <StatusDot tone={meta.tone} label={meta.label} />
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
        </TabsContent>

        <TabsContent value="results" className="mt-5">
          {resultsLoading && <LoadingBlock />}
          {resultsError && <ErrorBlock label="Không tải được kết quả." />}
          {results && results.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Chưa có kết quả nào được ghi cho đề tài này.</p>
          )}
          {results && results.length > 0 && (
            <div className="space-y-2">
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
                      {meta && <StatusDot tone={meta.tone} label={meta.label} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
