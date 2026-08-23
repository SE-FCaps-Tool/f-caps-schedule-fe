"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, Search, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useSchedulingReadiness,
  useRoundScheduleVersions,
  useScheduleVersion,
  useGenerateSchedule,
  useSetActiveScheduleVersion,
  useDiscardScheduleVersion,
  useChangeSessionRoom,
  useReplaceSessionReviewer,
  usePostponeRoundSession,
} from "@/hooks/manager/useScheduling";
import { useRoundSessions, useAvailableRooms, useRoomCatalog } from "@/hooks/manager/useRoomAssignment";
import { SessionDrawer } from "@/app/(manager)/manager/calendar/components/session-drawer";
import { assignmentToDisplaySession, toDisplaySession } from "@/app/(manager)/manager/calendar/components/day-grid";
import type { DisplaySession } from "@/app/(manager)/manager/calendar/components/types";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import type { RoundScheduleVersionItem } from "@/lib/api/services/fetchScheduling";
import { ErrorBlock } from "./round-detail-shared";
import { RoundAvailabilityHeatmap } from "./round-availability-heatmap";
import { ScheduleBoard } from "./schedule-board";

/** Cột giữa — quản lý phương án và bảng lịch ngày × giờ dùng chung cho nháp/đã gán phòng. */
export function RoundCalendarPanel({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const { data: readiness } = useSchedulingReadiness(roundId);
  const { data: roundVersions, isLoading: roundVersionsLoading, isError: roundVersionsError } = useRoundScheduleVersions(roundId);
  const generateSchedule = useGenerateSchedule();
  const setActiveVersion = useSetActiveScheduleVersion();
  const discardVersion = useDiscardScheduleVersion();

  // Ưu tiên phương án đã PUBLISHED (lịch chính thức); chưa publish thì xem trước bản ACTIVE.
  const currentVersion = useMemo(() => {
    if (!roundVersions || roundVersions.length === 0) return null;
    return roundVersions.find((v) => v.status === "PUBLISHED") ?? roundVersions.find((v) => v.status === "ACTIVE") ?? null;
  }, [roundVersions]);

  // Bản nháp mới nhất chưa kích hoạt — để đối chiếu với bản hiện tại ngay trên cùng 1 lưới lịch.
  const latestDraft = useMemo(() => {
    if (!roundVersions) return null;
    let best: RoundScheduleVersionItem | null = null;
    for (const v of roundVersions) {
      if (v.status !== "DRAFT") continue;
      if (!best || v.versionNumber > best.versionNumber) best = v;
    }
    return best;
  }, [roundVersions]);

  const hasAnyVersion = currentVersion !== null || latestDraft !== null;
  const canRun = readiness?.ready ?? false;

  const [phaseTab, setPhaseTab] = useState<"before" | "after">("before");
  const [afterVersionTab, setAfterVersionTab] = useState<"current" | "draft">("draft");
  const effectivePhaseTab = phaseTab;
  const effectiveVersionTab = latestDraft ? afterVersionTab : "current";
  const previewVersion = effectiveVersionTab === "draft" ? latestDraft : currentVersion;
  const isPreviewingDraft = effectiveVersionTab === "draft" && latestDraft !== null;

  function handleRunSchedule() {
    const staleDraftId = latestDraft?.id ?? null;
    generateSchedule.mutate(roundId, {
      onSuccess: (data) => {
        setPhaseTab("after");
        setAfterVersionTab("draft");
        if (staleDraftId && data.versionId !== staleDraftId) {
          discardVersion.mutate({ roundId, versionId: staleDraftId });
        }
      },
    });
  }

  const showsCurrentVersion = !isPreviewingDraft && currentVersion !== null;
  const { data: availableRooms } = useAvailableRooms(
    showsCurrentVersion && currentVersion?.status === "ACTIVE" ? roundId : null
  );
  const { data: catalogRooms } = useRoomCatalog(
    showsCurrentVersion && currentVersion?.status === "PUBLISHED"
  );
  // Session/phòng thật chỉ tồn tại cho bản hiện tại (ACTIVE/PUBLISHED) — BE chỉ tạo Session lúc
  // kích hoạt, nên chỉ fetch theo currentVersion, không theo previewVersion.
  const {
    data: rawSessions,
    isLoading: currentSessionsLoading,
    isError: currentSessionsError,
  } = useRoundSessions(roundId, currentVersion?.id ?? null);

  const rooms = useMemo(() => {
    if (!showsCurrentVersion) return [];
    if (currentVersion?.status === "ACTIVE") return availableRooms ?? [];
    if (currentVersion?.status !== "PUBLISHED") return [];

    const allowedTypes = new Set(round.roomTypes);
    const referencedRoomIds = new Set((rawSessions ?? []).map((session) => session.roomId).filter(Boolean));
    return (catalogRooms ?? []).filter(
      (room) =>
        referencedRoomIds.has(room.id) ||
        (room.status === "ACTIVE" && allowedTypes.has(room.type))
    );
  }, [availableRooms, catalogRooms, currentVersion?.status, rawSessions, round.roomTypes, showsCurrentVersion]);

  // Bản nháp chưa kích hoạt chỉ có solver assignment thô (chưa gán phòng) — đọc qua version detail,
  // không qua /sessions (BE trả rỗng cho version chưa activate).
  const {
    data: draftVersionDetail,
    isLoading: draftLoading,
    isError: draftError,
  } = useScheduleVersion(isPreviewingDraft && latestDraft ? Number(latestDraft.id) : null);

  const changeRoom = useChangeSessionRoom(roundId, currentVersion?.id ?? null);
  const replaceReviewer = useReplaceSessionReviewer(roundId, currentVersion?.id ?? null);
  const postponeSession = usePostponeRoundSession(roundId, currentVersion?.id ?? null);

  const currentSessions: DisplaySession[] = useMemo(
    () => (rawSessions ?? []).map((s) => toDisplaySession(s, rooms ?? [])),
    [rawSessions, rooms]
  );
  const draftSessions: DisplaySession[] = useMemo(
    () => (draftVersionDetail?.assignments ?? []).map(assignmentToDisplaySession),
    [draftVersionDetail]
  );
  const sessions = isPreviewingDraft ? draftSessions : currentSessions;
  const sessionsLoading = isPreviewingDraft ? draftLoading : currentSessionsLoading;
  const sessionsError = isPreviewingDraft ? draftError : currentSessionsError;

  const roomColumns = rooms ?? [];
  const [search, setSearch] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto lg:h-full lg:min-h-0">
      <div className="shrink-0">
        {readiness && !readiness.ready && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">Chưa đủ điều kiện chạy xếp lịch</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700 dark:text-amber-400">
              {readiness.blockingIssues?.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {readiness && readiness.warnings?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {readiness.warnings.map((w) => (
              <span key={w.code} className="rounded-md border border-border px-2 py-1">
                {w.code}: {w.count}
              </span>
            ))}
          </div>
        )}

        {roundVersionsLoading && <Skeleton className="mt-3 h-9 w-full max-w-md" />}
        {roundVersionsError && <ErrorBlock label="Không tải được các phương án lịch." />}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1" role="tablist" aria-label="Giai đoạn xếp lịch">
            {(["before", "after"] as const).map((tab) => {
              const isActive = effectivePhaseTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setPhaseTab(tab)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "before" ? "Trước khi chạy thuật toán" : "Sau khi chạy thuật toán"}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentVersion?.status === "ACTIVE" && (
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/manager/rounds/${roundId}/room-assignment`} />}>
                Gán phòng
              </Button>
            )}
            {latestDraft && (
              <Button
                variant="ghost"
                size="sm"
                disabled={discardVersion.isPending}
                onClick={() => discardVersion.mutate({ roundId, versionId: latestDraft.id })}
              >
                Loại bỏ nháp
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={generateSchedule.isPending || !canRun} onClick={handleRunSchedule}>
              <RotateCcw />
              {generateSchedule.isPending ? "Đang chạy..." : hasAnyVersion ? "Chạy lại" : "Chạy thuật toán"}
            </Button>
            {latestDraft && (
              <Button size="sm" disabled={setActiveVersion.isPending} onClick={() => setActiveVersion.mutate({ roundId, versionId: latestDraft.id })}>
                <CheckCircle2 />
                Kích hoạt
              </Button>
            )}
          </div>
        </div>
      </div>

      {effectivePhaseTab === "before" && (
        <div className="min-h-0 flex-1">
          <RoundAvailabilityHeatmap
            roundId={roundId}
            round={round}
            hasVersions={hasAnyVersion}
            readiness={readiness}
            onRunSchedule={handleRunSchedule}
            runPending={generateSchedule.isPending}
          />
        </div>
      )}

      {effectivePhaseTab === "after" && (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {hasAnyVersion && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Chọn phương án lịch">
                {currentVersion && (
                  <button
                    type="button"
                    onClick={() => setAfterVersionTab("current")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      effectiveVersionTab === "current" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Đã gán phòng · V{currentVersion.versionNumber}
                  </button>
                )}
                {latestDraft && (
                  <button
                    type="button"
                    onClick={() => setAfterVersionTab("draft")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      effectiveVersionTab === "draft" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Lịch nháp · V{latestDraft.versionNumber}
                  </button>
                )}
              </div>
              <div className="relative w-52">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nhóm, giảng viên..." className="h-8 pl-8 text-sm" />
              </div>
            </div>
          )}

          {!hasAnyVersion && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm font-medium">Chưa có phương án lịch</p>
              <p className="mt-1 text-sm text-muted-foreground">Chạy thuật toán ở tab “Trước khi chạy thuật toán” để tạo lịch nháp.</p>
            </div>
          )}
          {hasAnyVersion && sessionsLoading && <Skeleton className="h-64 w-full" />}
          {hasAnyVersion && sessionsError && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <WifiOff className="size-4 shrink-0" />
              Không tải được phương án lịch.
            </div>
          )}
          {hasAnyVersion && !sessionsLoading && !sessionsError && previewVersion && (
            <>
              <p className="text-xs text-muted-foreground">
                {isPreviewingDraft ? "Bản nháp chưa gán phòng — các phòng sẽ xuất hiện sau khi kích hoạt." : "Bản đang dùng đã gán phòng — bấm vào buổi để xem chi tiết."}
              </p>
              <ScheduleBoard
                round={round}
                sessions={sessions}
                search={search}
                compact={!isPreviewingDraft}
                onSelect={isPreviewingDraft ? undefined : setActiveSessionId}
              />
            </>
          )}
        </div>
      )}

      <SessionDrawer
        session={activeSession}
        rooms={roomColumns}
        onOpenChange={(open) => !open && setActiveSessionId(null)}
        changeRoomPending={changeRoom.isPending}
        onChangeRoom={(roomId, reason) => {
          if (!activeSessionId) return;
          changeRoom.mutate({ sessionId: activeSessionId, payload: { roomId, reason } });
        }}
        replaceReviewerPending={replaceReviewer.isPending}
        onReplaceReviewer={(oldLecturerId, newLecturerId, reason) => {
          if (!activeSessionId) return;
          replaceReviewer.mutate({ sessionId: activeSessionId, payload: { oldLecturerId, newLecturerId, reason } });
        }}
        postponePending={postponeSession.isPending}
        onPostpone={(reason) => {
          if (!activeSessionId) return;
          postponeSession.mutate({ sessionId: activeSessionId, payload: { reason } });
        }}
      />

    </div>
  );
}
