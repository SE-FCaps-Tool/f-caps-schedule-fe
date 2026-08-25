"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarDays, Search, Table2, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_TYPE_LABEL, ROUND_SCHEDULE_VERSION_STATUS_META } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRounds, useRoundDetail } from "@/hooks/manager/useRounds";
import { useRoundScheduleVersions } from "@/hooks/manager/useScheduling";
import { useRoundSessions, useAvailableRooms, useRoomCatalog } from "@/hooks/manager/useRoomAssignment";
import {
  useChangeSessionRoom,
  useReplaceSessionReviewer,
  usePostponeRoundSession,
} from "@/hooks/manager/useScheduling";
import { SessionDrawer } from "./session-drawer";
import { matchesSearch, toDisplaySession } from "./day-grid";
import { ScheduleBoard } from "@/app/(round-detail)/manager/rounds/[roundId]/components/schedule-board";
import type { DisplaySession } from "./types";

type ViewMode = "calendar" | "week" | "table";

export function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentSemester } = useSemesterContext();
  const semesterId = currentSemester?.id;

  const { data: roundsResult, isLoading: roundsLoading } = useRounds(semesterId);
  const rounds = roundsResult?.data;
  const roundParam = searchParams.get("round");
  const selectedRoundId = roundParam ?? rounds?.[0]?.id ?? null;
  const selectedRound = rounds?.find((r) => r.id === selectedRoundId) ?? null;

  const { data: round } = useRoundDetail(selectedRoundId);
  const { data: versions, isLoading: versionsLoading, isError: versionsError } = useRoundScheduleVersions(selectedRoundId);

  // Calendar chỉ hiển thị lịch cuối cùng đã được công bố.
  const currentVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    return versions.find((v) => v.status === "PUBLISHED") ?? null;
  }, [versions]);

  const { data: availableRooms } = useAvailableRooms(
    currentVersion?.status === "ACTIVE" ? selectedRoundId : null
  );
  const { data: catalogRooms } = useRoomCatalog(currentVersion?.status === "PUBLISHED");

  const { data: rawSessions, isLoading: sessionsLoading, isError: sessionsError } = useRoundSessions(
    selectedRoundId,
    currentVersion?.id ?? null
  );

  const rooms = useMemo(() => {
    if (currentVersion?.status === "ACTIVE") return availableRooms ?? [];
    if (currentVersion?.status !== "PUBLISHED") return [];

    const allowedTypes = new Set(round?.roomTypes ?? []);
    const referencedRoomIds = new Set((rawSessions ?? []).map((session) => session.roomId).filter(Boolean));
    return (catalogRooms ?? []).filter(
      (room) =>
        referencedRoomIds.has(room.id) ||
        (room.status === "ACTIVE" && allowedTypes.has(room.type))
    );
  }, [availableRooms, catalogRooms, currentVersion?.status, rawSessions, round?.roomTypes]);

  const changeRoom = useChangeSessionRoom(selectedRoundId ?? "", currentVersion?.id ?? null);
  const replaceReviewer = useReplaceSessionReviewer(selectedRoundId ?? "", currentVersion?.id ?? null);
  const postponeSession = usePostponeRoundSession(selectedRoundId ?? "", currentVersion?.id ?? null);

  const sessions: DisplaySession[] = useMemo(
    () => (rawSessions ?? []).map((s) => toDisplaySession(s, rooms ?? [])),
    [rawSessions, rooms]
  );

  const dates = useMemo(() => round?.days.map((d) => d.date) ?? [], [round]);

  const roomColumns = rooms ?? [];

  const [view, setView] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const tableSessions = useMemo(
    () =>
      sessions
        .filter((session) => matchesSearch(session, search))
        .sort((a, b) => `${a.date}-${a.start}-${a.groupCode}`.localeCompare(`${b.date}-${b.start}-${b.groupCode}`)),
    [search, sessions]
  );

  if (roundsLoading) {
    return (
      <div className="flex h-full flex-col">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lịch đánh giá</h1>
          <div className="mt-1.5">
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!rounds || rounds.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-base font-medium">Học kỳ này chưa có đợt đánh giá nào</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Tạo đợt đánh giá trước khi xem lịch.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lịch đánh giá</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Select
              value={selectedRoundId}
              onValueChange={(v) => {
                const params = new URLSearchParams(searchParams.toString());
                if (v) params.set("round", v);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
            >
              <SelectTrigger className="h-7 gap-1 border-none bg-transparent px-0 font-medium shadow-none">
                <SelectValue placeholder="Chọn đợt">{() => (selectedRound ? ROUND_TYPE_LABEL[selectedRound.type] : "Chọn đợt")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {ROUND_TYPE_LABEL[r.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentVersion && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <StatusDot
                  tone={ROUND_SCHEDULE_VERSION_STATUS_META[currentVersion.status].tone}
                  label={`V${currentVersion.versionNumber} — ${ROUND_SCHEDULE_VERSION_STATUS_META[currentVersion.status].label}`}
                />
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">{sessions.length} buổi đã xếp</span>
              </>
            )}
          </div>
        </div>
      </div>

      {versionsLoading && <Skeleton className="mt-6 h-64 w-full" />}
      {versionsError && (
        <div className="mt-6 flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0" />
          Không tải được các phương án lịch.
        </div>
      )}
      {versions && versions.length === 0 && (
        <p className="mt-6 py-10 text-center text-sm text-muted-foreground">
          Đợt này chưa có phương án lịch — vào trang đợt đánh giá để chạy xếp lịch.
        </p>
      )}
      {versions && versions.length > 0 && !currentVersion && (
        <p className="mt-6 py-10 text-center text-sm text-muted-foreground">
          Chưa có lịch nào được công bố — lịch đánh giá sẽ hiển thị sau khi Manager công bố phương án.
        </p>
      )}

      {currentVersion && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-8" />

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
              <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5" aria-label="Kiểu hiển thị lịch">
                {(["calendar", "week", "table"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    aria-pressed={view === mode}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      view === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "calendar" && <CalendarDays className="size-3.5" aria-hidden="true" />}
                    {mode === "table" && <Table2 className="size-3.5" aria-hidden="true" />}
                    {mode === "calendar" ? "Lịch phòng" : mode === "week" ? "Tuần" : "Bảng"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex-1">
            {sessionsLoading && <Skeleton className="h-64 w-full" />}
            {sessionsError && (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <WifiOff className="size-4 shrink-0" />
                Không tải được phiên đánh giá.
              </div>
            )}

            {!sessionsLoading && !sessionsError && view === "calendar" && round && (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Lịch theo ngày</p>
                    <p className="text-xs text-muted-foreground">Mỗi ô hiển thị các nhóm và hội đồng trong cùng khung giờ.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                    {sessions.length} buổi
                  </span>
                </div>
                <ScheduleBoard
                  round={round}
                  sessions={sessions}
                  search={search}
                  onSelect={setActiveSessionId}
                />
              </div>
            )}

            {!sessionsLoading && !sessionsError && view === "week" && (
              <div className="space-y-6">
                {dates.map((date) => (
                  <div key={date}>
                    <p className="mb-2 text-sm font-medium">{formatDate(date, "dddd, DD/MM")}</p>
                    <ScheduleBoard round={{ ...round!, days: (round?.days ?? []).filter((day) => day.date === date) }} sessions={sessions.filter((s) => s.date === date)} search={search} compact onSelect={setActiveSessionId} />
                  </div>
                ))}
              </div>
            )}

            {!sessionsLoading && !sessionsError && view === "table" && (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Danh sách theo thời gian</p>
                    <p className="text-xs text-muted-foreground">Bấm vào một dòng để xem đầy đủ hội đồng và thao tác.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                    {tableSessions.length} buổi
                  </span>
                </div>
                <div className="max-h-[min(68vh,720px)] overflow-auto">
                  <table className="min-w-[920px] w-full text-sm">
                    <thead className="sticky top-0 z-20 bg-background/95 text-left text-xs text-muted-foreground backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="sticky left-0 z-30 bg-background/95 px-4 py-3 font-medium">Nhóm / đề tài</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Khung giờ</th>
                        <th className="px-4 py-3 font-medium">Phòng</th>
                        <th className="px-4 py-3 font-medium">Hội đồng</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSessions.map((session) => {
                        const visibleReviewers = session.reviewers.slice(0, 2);
                        const remainingReviewers = Math.max(0, session.reviewers.length - visibleReviewers.length);
                        return (
                          <tr
                            key={session.id}
                            tabIndex={0}
                            role="button"
                            aria-label={`Xem chi tiết ${session.groupCode}`}
                            className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                            onClick={() => setActiveSessionId(session.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveSessionId(session.id);
                              }
                            }}
                          >
                            <td className="sticky left-0 z-10 max-w-[280px] bg-card px-4 py-3">
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">{session.groupCode}</span>
                                {session.projectTitle && <span className="truncate text-xs text-muted-foreground">{session.projectTitle}</span>}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">{formatDate(session.date, "DD/MM")}</td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums">{session.start} – {session.end}</td>
                            <td className="px-4 py-3 font-medium">{session.roomCode}</td>
                            <td className="max-w-[300px] px-4 py-3">
                              <div className="flex max-w-[280px] flex-wrap gap-1" title={session.reviewers.map((reviewer) => reviewer.name).join(" · ")}>
                                {visibleReviewers.map((reviewer) => (
                                  <span key={reviewer.id} className="max-w-[130px] truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {reviewer.name}
                                  </span>
                                ))}
                                {remainingReviewers > 0 && <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">+{remainingReviewers}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">{session.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {tableSessions.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Không có buổi nào khớp tìm kiếm.</p>}
                </div>
              </div>
            )}
          </div>
        </>
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
