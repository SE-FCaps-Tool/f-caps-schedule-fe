"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatInVietnamTime } from "@/lib/utils/formatDate";
import { assignmentToDisplaySession } from "@/app/(manager)/manager/calendar/components/day-grid";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import {
  useActivateVersion,
  useRunSchedule,
  useScheduleVersion,
  useScheduleVersions,
} from "@/hooks/manager/useScheduling";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import type {
  ScheduleObjectiveProfile,
  ScheduleVariantMetrics,
  ScheduleVariantSummary,
  ScheduleVersionSummary,
} from "@/lib/api/services/fetchScheduling";
import { ScheduleBoard } from "./schedule-board";

const PROFILE_META: Record<ScheduleObjectiveProfile, { title: string; description: string }> = {
  LECTURER_COMPACT: {
    title: "Liền mạch GV",
    description: "Ưu tiên các ca liên tiếp để giảm thời gian chờ của giảng viên.",
  },
  LOAD_BALANCED: {
    title: "Cân bằng tải",
    description: "Phân bổ số ca và tổng thời lượng đều hơn giữa các giảng viên.",
  },
  EARLY_FINISH: {
    title: "Kết thúc sớm",
    description: "Ưu tiên đưa ca cuối cùng của ngày về sớm nhất có thể.",
  },
};

function variantList(
  runVariants: ScheduleVariantSummary[] | undefined,
  storedVariants: ScheduleVersionSummary[] | undefined,
): ScheduleVariantSummary[] {
  if (runVariants && runVariants.length > 0) return runVariants;
  const variants = (storedVariants ?? []).filter(
    (version) => version.objectiveProfile && version.objectiveProfile in PROFILE_META,
  );
  return variants.slice(-3).map((version) => ({
    versionId: version.id,
    versionNo: version.versionNo,
    status: version.status,
    objectiveProfile: version.objectiveProfile as ScheduleObjectiveProfile,
    objectiveLabel: version.objectiveLabel ?? PROFILE_META[version.objectiveProfile as ScheduleObjectiveProfile].title,
    scheduledCount: version.scheduledCount ?? version.metrics?.scheduledGroups ?? 0,
    unscheduledCount: version.unscheduledCount ?? 0,
    unscheduled: [],
    objective: version.totalScore ?? 0,
    softScores: version.softScores,
    metrics: version.metrics ?? EMPTY_METRICS,
  }));
}

const EMPTY_METRICS: ScheduleVariantMetrics = {
  reviewerBlockCount: 0,
  reviewerIdleMinutes: 0,
  reviewerLoadSpread: 0,
  reviewerMinuteSpread: 0,
  latestEndAt: null,
  scheduledGroups: 0,
};

function formatMetric(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function ScheduleVariantsPanel({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const { currentSemesterId } = useSemesterContext();
  const numericRoundId = Number(roundId);
  const semesterId = Number(round.semesterId || currentSemesterId || 0) || null;
  const runSchedule = useRunSchedule();
  const activateVersion = useActivateVersion();
  const { data: storedVersions, isLoading: versionsLoading } = useScheduleVersions(numericRoundId, semesterId);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const variants = variantList(runSchedule.data?.versions, storedVersions);
  const selected = variants.find((version) => version.versionId === selectedVersionId) ?? variants[0];
  const { data: selectedDetail, isFetching: detailLoading } = useScheduleVersion(
    selected?.versionId ?? null,
    semesterId,
  );

  const previewSessions = useMemo(
    () => (selectedDetail?.assignments ?? []).map(assignmentToDisplaySession),
    [selectedDetail?.assignments],
  );

  const handleRun = () => {
    runSchedule.mutate({ roundId: numericRoundId, semesterId });
  };

  const handleActivate = () => {
    if (!selected) return;
    activateVersion.mutate({
      versionId: selected.versionId,
      roundId: numericRoundId,
      semesterId,
    });
  };

  return (
    <Card className="mb-4 border-primary/20 bg-primary/[0.02]">
      <CardHeader className="gap-3 border-b border-border/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Phương án xếp lịch
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Chạy một lần để tạo 3 bản nháp, sau đó xem trước và chọn bản phù hợp nhất.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleRun} disabled={runSchedule.isPending}>
            {runSchedule.isPending ? <Loader2 className="animate-spin" /> : <Play />}
            {runSchedule.isPending ? "Đang chạy…" : "Tạo 3 phương án"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {versionsLoading && variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Đang tải các phương án gần nhất…</p>
        ) : variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Chưa có phương án. Nhấn “Tạo 3 phương án” để bắt đầu.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {variants.map((variant) => {
                const meta = PROFILE_META[variant.objectiveProfile];
                const isSelected = variant.versionId === selected?.versionId;
                const metrics = variant.metrics;
                const scheduledCount = variant.scheduledCount ?? metrics?.scheduledGroups ?? 0;
                const unscheduledCount = variant.unscheduledCount ?? 0;
                return (
                  <button
                    key={variant.versionId}
                    type="button"
                    onClick={() => setSelectedVersionId(variant.versionId)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors hover:border-primary/50",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-background",
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{variant.objectiveLabel || meta.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">V{variant.versionNo} · {meta.description}</div>
                      </div>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <Metric label="Đã xếp" value={formatMetric(scheduledCount)} />
                      <Metric label="Chưa xếp" value={formatMetric(unscheduledCount)} />
                      <Metric label="Block GV" value={formatMetric(metrics?.reviewerBlockCount ?? 0)} />
                      <Metric label="Chờ GV" value={`${formatMetric(metrics?.reviewerIdleMinutes ?? 0)} phút`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Eye className="size-4 text-muted-foreground" />
                    Xem trước: {selected.objectiveLabel || PROFILE_META[selected.objectiveProfile].title}
                    {selected.metrics?.latestEndAt && (
                      <span className="text-xs font-normal text-muted-foreground">
                        · kết thúc {formatInVietnamTime(selected.metrics.latestEndAt, "HH:mm")}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleActivate}
                    disabled={activateVersion.isPending || selected.status !== "DRAFT"}
                  >
                    {activateVersion.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                    Chọn phương án này
                  </Button>
                </div>
                {detailLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Đang tải bản xem trước…</p>
                ) : (
                  <div className="mt-3">
                    <ScheduleBoard round={round} sessions={previewSessions} search="" compact />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium tabular-nums">{value}</div>
    </div>
  );
}
