"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Search, WifiOff } from "lucide-react";
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
import { useRoundSessions, useAvailableRooms } from "@/hooks/manager/useRoomAssignment";
import {
  useChangeSessionRoom,
  useReplaceSessionReviewer,
  usePostponeRoundSession,
} from "@/hooks/manager/useScheduling";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { SessionCard } from "./session-card";
import { SessionDrawer } from "./session-drawer";
import type { DisplaySession } from "./types";
import type { RoundSession, AssignableRoom } from "@/lib/api/services/fetchRoomAssignment";

type ViewMode = "day" | "week" | "list";

function toDisplaySession(session: RoundSession, rooms: AssignableRoom[]): DisplaySession {
  const room = rooms.find((r) => r.id === session.roomId);
  return {
    id: session.id,
    groupId: session.group.id,
    groupCode: session.group.code,
    projectTitle: session.project.name,
    date: session.date,
    start: session.startTime,
    end: session.endTime,
    timeslotId: session.timeslotId,
    roomId: session.roomId,
    roomCode: room?.code ?? (session.roomId ? `#${session.roomId}` : "Chưa gán"),
    reviewers: session.council.map((c) => ({ id: c.lecturerId, name: c.fullName })),
    status: session.status,
  };
}

function matchesSearch(session: DisplaySession, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    session.groupCode.toLowerCase().includes(q) ||
    (session.projectTitle?.toLowerCase().includes(q) ?? false) ||
    session.reviewers.some((r) => r.name.toLowerCase().includes(q))
  );
}

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
  const { data: rooms } = useAvailableRooms(selectedRoundId);

  // Ưu tiên phương án đã PUBLISHED (lịch chính thức); chưa publish thì xem trước bản ACTIVE.
  const currentVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    return versions.find((v) => v.status === "PUBLISHED") ?? versions.find((v) => v.status === "ACTIVE") ?? null;
  }, [versions]);

  const { data: rawSessions, isLoading: sessionsLoading, isError: sessionsError } = useRoundSessions(
    selectedRoundId,
    currentVersion?.id ?? null
  );

  const changeRoom = useChangeSessionRoom(selectedRoundId ?? "", currentVersion?.id ?? null);
  const replaceReviewer = useReplaceSessionReviewer(selectedRoundId ?? "", currentVersion?.id ?? null);
  const postponeSession = usePostponeRoundSession(selectedRoundId ?? "", currentVersion?.id ?? null);

  const sessions: DisplaySession[] = useMemo(
    () => (rawSessions ?? []).map((s) => toDisplaySession(s, rooms ?? [])),
    [rawSessions, rooms]
  );

  const dates = useMemo(() => round?.days.map((d) => d.date) ?? [], [round]);

  const timeslotRows = useMemo(() => {
    if (!round) return [];
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

  if (roundsLoading) {
    return <Skeleton className="h-64 w-full" />;
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
          Chưa có phương án nào được kích hoạt — vào trang đợt đánh giá để kích hoạt.
        </p>
      )}

      {currentVersion && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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

          <div className="mt-5 flex-1">
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

function DayGrid({
  sessions,
  rooms,
  timeslotRows,
  search,
  draggingId,
  hoveredCell,
  compact,
  onDragStart,
  onDragEnd,
  onCellDragOver,
  onDrop,
  onSelect,
}: {
  sessions: DisplaySession[];
  rooms: AssignableRoom[];
  timeslotRows: { start: string; end: string }[];
  search: string;
  draggingId: string | null;
  hoveredCell: { roomId: string; start: string } | null;
  compact?: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onCellDragOver: (cell: { roomId: string; start: string } | null) => void;
  onDrop: (room: AssignableRoom, start: string) => void;
  onSelect: (id: string) => void;
}) {
  const cellHeight = compact ? 56 : 92;

  if (rooms.length === 0 || timeslotRows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có phòng hoặc timeslot cho đợt này.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="grid min-w-140" style={{ gridTemplateColumns: `64px repeat(${rooms.length}, minmax(160px, 1fr))` }}>
        <div className={cn("sticky left-0 z-10 border-b border-border bg-background", compact ? "h-8" : "h-10")} />
        {rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              "flex items-center justify-center border-b border-l border-border bg-muted/30 text-sm font-medium",
              compact ? "h-8" : "h-10"
            )}
          >
            {room.code}
          </div>
        ))}

        {timeslotRows.map((slot) => (
          <div key={slot.start} className="contents">
            <div
              className="sticky left-0 z-10 flex items-start justify-end border-b border-border bg-background pt-1.5 pr-2 text-xs text-muted-foreground tabular-nums"
              style={{ height: cellHeight }}
            >
              {slot.start}
            </div>
            {rooms.map((room) => {
              const session = sessions.find((s) => s.roomId === room.id && s.start === slot.start);
              const isHovered = hoveredCell?.roomId === room.id && hoveredCell?.start === slot.start;
              return (
                <div
                  key={`${room.id}-${slot.start}`}
                  data-cell={`${room.id}-${slot.start}`}
                  className={cn(
                    "border-b border-l border-border p-1 transition-colors",
                    isHovered && !session && "bg-primary/10 outline-1 outline-dashed outline-primary/40"
                  )}
                  style={{ height: cellHeight }}
                  onDragOver={(e) => {
                    if (!session) {
                      e.preventDefault();
                      onCellDragOver({ roomId: room.id, start: slot.start });
                    }
                  }}
                  onDragLeave={() => onCellDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(room, slot.start);
                  }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {session && (
                      <SessionCard
                        key={session.id}
                        session={session}
                        dimmed={!matchesSearch(session, search)}
                        dragging={draggingId === session.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", session.id);
                          onDragStart(session.id);
                        }}
                        onDragEnd={onDragEnd}
                        onClick={() => onSelect(session.id)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
