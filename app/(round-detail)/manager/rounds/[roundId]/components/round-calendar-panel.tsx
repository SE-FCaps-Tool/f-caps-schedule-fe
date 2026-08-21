"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, Search, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
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
import { useRoundSessions, useAvailableRooms } from "@/hooks/manager/useRoomAssignment";
import { SessionDrawer } from "@/app/(manager)/manager/calendar/components/session-drawer";
import { DayGrid, assignmentToDisplaySession, matchesSearch, toDisplaySession } from "@/app/(manager)/manager/calendar/components/day-grid";
import type { DisplaySession } from "@/app/(manager)/manager/calendar/components/types";
import type { AssignableRoom } from "@/lib/api/services/fetchRoomAssignment";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import type { RoundScheduleVersionItem } from "@/lib/api/services/fetchScheduling";
import { ErrorBlock } from "./round-detail-shared";
import { RoundAvailabilityHeatmap } from "./round-availability-heatmap";
import { DraftScheduleGrid } from "./draft-schedule-grid";

type ViewMode = "day" | "week" | "list";

/** Cột giữa — quản lý phương án lịch (chạy/kích hoạt/loại bỏ) và lưới Lịch (phòng × giờ) cho phương án đang dùng. */
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

  const [previewTab, setPreviewTab] = useState<"current" | "draft">("draft");
  // Mỗi khi có bản nháp mới (vừa chạy xong), tự mở tab Nháp để manager thấy kết quả ngay — điều
  // chỉnh state ngay trong lúc render (theo khuyến nghị của React) thay vì dùng effect, tránh
  // 1 lượt render thừa mỗi khi versionId đổi.
  const [lastSeenDraftId, setLastSeenDraftId] = useState<string | null>(null);
  if (latestDraft && latestDraft.id !== lastSeenDraftId) {
    setLastSeenDraftId(latestDraft.id);
    setPreviewTab("draft");
  }
  const effectiveTab: "current" | "draft" = latestDraft ? previewTab : "current";
  const previewVersion = effectiveTab === "draft" ? latestDraft : currentVersion;
  const isPreviewingDraft = effectiveTab === "draft" && latestDraft !== null;

  function handleRunSchedule() {
    const staleDraftId = latestDraft?.id ?? null;
    generateSchedule.mutate(roundId, {
      onSuccess: (data) => {
        if (staleDraftId && data.versionId !== staleDraftId) {
          discardVersion.mutate({ roundId, versionId: staleDraftId });
        }
      },
    });
  }

  const { data: rooms } = useAvailableRooms(roundId);
  // Session/phòng thật chỉ tồn tại cho bản hiện tại (ACTIVE/PUBLISHED) — BE chỉ tạo Session lúc
  // kích hoạt, nên chỉ fetch theo currentVersion, không theo previewVersion.
  const {
    data: rawSessions,
    isLoading: currentSessionsLoading,
    isError: currentSessionsError,
  } = useRoundSessions(roundId, currentVersion?.id ?? null);

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

  const dates = useMemo(() => round.days.map((d) => d.date), [round]);
  const timeslotRows = useMemo(() => {
    const seen = new Map<string, { start: string; end: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) seen.set(slot.startTime, { start: slot.startTime, end: slot.endTime });
    }
    return Array.from(seen.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [round]);
  const roomColumns = rooms ?? [];

  const [dateOverride, setDateOverride] = useState<string | null>(null);
  const selectedDate = dateOverride && dates.includes(dateOverride) ? dateOverride : (dates[0] ?? null);

  const [view, setView] = useState<ViewMode>("day");
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ roomId: string; start: string } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingRoomMove, setPendingRoomMove] = useState<{ sessionId: string; roomId: string } | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const sessionsForDate = useMemo(() => sessions.filter((s) => s.date === selectedDate), [sessions, selectedDate]);

  function handleDrop(room: AssignableRoom, start: string) {
    if (!draggingId) return;
    const session = sessions.find((s) => s.id === draggingId);
    setHoveredCell(null);
    setDraggingId(null);
    if (!session || session.start !== start || session.roomId === room.id) return;
    setPendingRoomMove({ sessionId: draggingId, roomId: room.id });
  }

  function confirmRoomMove(reason: string) {
    if (!pendingRoomMove) return;
    changeRoom.mutate({ sessionId: pendingRoomMove.sessionId, payload: { roomId: pendingRoomMove.roomId, reason } });
    setPendingRoomMove(null);
  }

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

        {hasAnyVersion && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {currentVersion && (
                <button
                  type="button"
                  onClick={() => setPreviewTab("current")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    effectiveTab === "current" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Hiện tại (V{currentVersion.versionNumber}
                  {currentVersion.status === "PUBLISHED" ? " · Đã công bố" : ""})
                </button>
              )}
              {latestDraft && (
                <button
                  type="button"
                  onClick={() => setPreviewTab("draft")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    effectiveTab === "draft" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Nháp mới (V{latestDraft.versionNumber}) · {latestDraft.scheduledCount} xếp
                  {latestDraft.unscheduledCount > 0 ? ` · ${latestDraft.unscheduledCount} chưa` : ""}
                  {latestDraft.overallScore != null ? ` · ${latestDraft.overallScore.toFixed(1)}đ` : ""}
                </button>
              )}
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
                {generateSchedule.isPending ? "Đang chạy..." : "Chạy lại"}
              </Button>
              {latestDraft && (
                <Button size="sm" disabled={setActiveVersion.isPending} onClick={() => setActiveVersion.mutate({ roundId, versionId: latestDraft.id })}>
                  <CheckCircle2 />
                  Kích hoạt
                </Button>
              )}
            </div>
          </div>
        )}

        {isPreviewingDraft && (
          <p className="mt-2 text-xs text-muted-foreground">
            Xem trước bản nháp — kéo-thả và xem chi tiết buổi bị tắt, kích hoạt để chỉnh sửa.
          </p>
        )}
      </div>

      {previewVersion && isPreviewingDraft && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Lịch xếp theo nháp — chưa gán phòng</p>
            <div className="relative w-52">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhóm, giảng viên..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-auto">
            {sessionsLoading && <Skeleton className="h-64 w-full" />}
            {sessionsError && (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <WifiOff className="size-4 shrink-0" />
                Không tải được phương án nháp.
              </div>
            )}
            {!sessionsLoading && !sessionsError && <DraftScheduleGrid round={round} sessions={sessions} search={search} />}
          </div>
        </div>
      )}

      {previewVersion && !isPreviewingDraft && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {dates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setDateOverride(date)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedDate === date ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {formatDate(date, "dd, DD/MM")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-52">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm nhóm, giảng viên..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="flex items-center rounded-lg bg-muted p-0.5">
                {(["day", "week", "list"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      view === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "day" ? "Ngày" : mode === "week" ? "Tuần" : "Danh sách"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1">
            {sessionsLoading && <Skeleton className="h-64 w-full" />}
            {sessionsError && (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <WifiOff className="size-4 shrink-0" />
                Không tải được phiên đánh giá.
              </div>
            )}

            {!sessionsLoading && !sessionsError && view === "day" && selectedDate && (
              <DayGrid
                sessions={sessionsForDate}
                rooms={roomColumns}
                timeslotRows={timeslotRows}
                search={search}
                draggingId={draggingId}
                hoveredCell={hoveredCell}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                onCellDragOver={setHoveredCell}
                onDrop={handleDrop}
                onSelect={setActiveSessionId}
              />
            )}

            {!sessionsLoading && !sessionsError && view === "week" && (
              <div className="space-y-6">
                {dates.map((date) => (
                  <div key={date}>
                    <p className="mb-2 text-sm font-medium">{formatDate(date, "dddd, DD/MM")}</p>
                    <DayGrid
                      sessions={sessions.filter((s) => s.date === date)}
                      rooms={roomColumns}
                      timeslotRows={timeslotRows}
                      search={search}
                      draggingId={null}
                      hoveredCell={null}
                      compact
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                      onCellDragOver={() => {}}
                      onDrop={() => {}}
                      onSelect={setActiveSessionId}
                    />
                  </div>
                ))}
              </div>
            )}

            {!sessionsLoading && !sessionsError && view === "list" && (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Nhóm</th>
                      <th className="py-2 font-medium">Ngày</th>
                      <th className="py-2 font-medium">Giờ</th>
                      <th className="py-2 font-medium">Phòng</th>
                      <th className="py-2 pr-4 font-medium">Reviewers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions
                      .filter((s) => matchesSearch(s, search))
                      .map((s) => (
                        <tr
                          key={s.id}
                          className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                          onClick={() => setActiveSessionId(s.id)}
                        >
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs font-medium">{s.groupCode}</span>
                          </td>
                          <td className="py-2.5 tabular-nums text-muted-foreground">{formatDate(s.date, "DD/MM")}</td>
                          <td className="py-2.5 tabular-nums">
                            {s.start} – {s.end}
                          </td>
                          <td className="py-2.5">{s.roomCode}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{s.reviewers.map((r) => r.name).join(", ")}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasAnyVersion && (
        <div className="min-h-0 flex-1">
          <RoundAvailabilityHeatmap
            roundId={roundId}
            round={round}
            hasVersions={!!(roundVersions && roundVersions.length > 0)}
            readiness={readiness}
            onRunSchedule={handleRunSchedule}
            runPending={generateSchedule.isPending}
          />
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

      <ReasonDialog
        open={pendingRoomMove !== null}
        onOpenChange={(open) => !open && setPendingRoomMove(null)}
        title="Xác nhận đổi phòng"
        description="Lý do sẽ được ghi vào audit log."
        confirmLabel="Xác nhận đổi"
        onConfirm={confirmRoomMove}
      />
    </div>
  );
}
