"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
              Phương án chỉ xếp nhóm, khung giờ và giảng viên. Sau khi kích hoạt, bạn có thể gán phòng tự động hoặc đổi phòng bằng tay.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleRun} disabled={runSchedule.isPending}>
            {runSchedule.isPending ? <Loader2 className="animate-spin" /> : <Play />}
            {runSchedule.isPending ? "Đang chạy…" : "Chạy thuật toán"}
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
            <div role="tablist" aria-label="Các phương án xếp lịch" className="flex flex-wrap gap-2">
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
                    role="tab"
                    aria-selected={isSelected}
                    className={cn(
                      "min-w-44 rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/50",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-background",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">V{variant.versionNo} · {variant.objectiveLabel || meta.title}</div>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatMetric(scheduledCount)} nhóm đã xếp · {formatMetric(unscheduledCount)} chưa xếp
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
                    Calendar: V{selected.versionNo} · {selected.objectiveLabel || PROFILE_META[selected.objectiveProfile].title}
                    {selected.metrics?.latestEndAt && (
                      <span className="text-xs font-normal text-muted-foreground">
                        · kết thúc {formatInVietnamTime(selected.metrics.latestEndAt, "HH:mm")}
                      </span>
                    )}
                    {selectedDetail && selected.status === "DRAFT" && (
                      <span className="text-xs font-normal text-muted-foreground">
                        · phòng gán sau khi kích hoạt
                      </span>
                    )}
                    {selectedDetail && selected.status !== "DRAFT" && (
                      <span className="text-xs font-normal text-muted-foreground">
                        · {selectedDetail.assignments.filter((assignment) => assignment.roomId != null).length}/
                        {selectedDetail.assignments.length} phòng đã gán
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selected.status === "ACTIVE" && (
                      <Link
                        href={`/manager/rounds/${roundId}/room-assignment`}
                        className="inline-flex h-9 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Gán phòng
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleActivate}
                      disabled={activateVersion.isPending || selected.status !== "DRAFT"}
                    >
                      {activateVersion.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                      Kích hoạt phương án
                    </Button>
                  </div>
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
