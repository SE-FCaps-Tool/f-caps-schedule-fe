"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../../../_shared/status-dot";
import { ROUND_TYPE_LABEL } from "../../../../_shared/labels";
import { useRoundDetail } from "@/hooks/manager/useRounds";
import { useRoundScheduleVersions } from "@/hooks/manager/useScheduling";
import {
  useRoundSessions,
  useAvailableRooms,
  useAssignRoom,
  useSuggestRooms,
  useApplySuggestions,
} from "@/hooks/manager/useRoomAssignment";
import type { RoundSession } from "@/lib/api/services/fetchRoomAssignment";

function AssignRoomDialog({
  session,
  onOpenChange,
  roundId,
}: {
  session: RoundSession | null;
  onOpenChange: (open: boolean) => void;
  roundId: string;
}) {
  const { data: rooms, isLoading } = useAvailableRooms(roundId, session ? { timeslotId: session.timeslotId } : undefined);
  const assignRoom = useAssignRoom(roundId);
  const [roomId, setRoomId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !roomId) return;
    assignRoom.mutate(
      { sessionId: session.id, payload: { roomId } },
      { onSuccess: () => { setRoomId(""); onOpenChange(false); } }
    );
  }

  return (
    <Dialog open={session !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gán phòng</DialogTitle>
            <DialogDescription>
              {session?.group.code} · {session ? formatDate(session.date, "DD/MM") : ""} · {session?.startTime}–{session?.endTime}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={roomId} onValueChange={(v) => v && setRoomId(v)} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn phòng"}>
                  {(v: string) => rooms?.find((r) => r.id === v)?.code ?? "Chọn phòng"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(rooms ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} · {r.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rooms && rooms.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Không còn phòng trống cho timeslot này.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={assignRoom.isPending || !roomId}>
              {assignRoom.isPending ? "Đang lưu..." : "Gán phòng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoomAssignmentPage({ roundId }: { roundId: string }) {
  const { data: round, isLoading: roundLoading } = useRoundDetail(roundId);
  const { data: versions } = useRoundScheduleVersions(roundId);
  const activeVersion = useMemo(() => versions?.find((v) => v.status === "ACTIVE"), [versions]);

  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError } = useRoundSessions(
    roundId,
    activeVersion?.id ?? null
  );
  const { data: rooms } = useAvailableRooms(roundId);
  const suggestRooms = useSuggestRooms();
  const applySuggestions = useApplySuggestions(roundId);
  const [suggestionCount, setSuggestionCount] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<RoundSession | null>(null);

  const dates = round?.days.map((d) => d.date) ?? [];
  const activeDate = selectedDate ?? dates[0] ?? null;
  const activeDay = round?.days.find((d) => d.date === activeDate);

  const sessionsByCell = useMemo(() => {
    const map = new Map<string, RoundSession>();
    for (const s of sessions ?? []) map.set(`${s.roomId ?? ""}__${s.timeslotId}`, s);
    return map;
  }, [sessions]);

  const unassigned = (sessions ?? []).filter((s) => s.roomId === null && s.date === activeDate);

  if (roundLoading) {
    return (
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-8 w-64" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <WifiOff className="size-4 shrink-0" />
        Không tải được đợt đánh giá.
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/manager/rounds/${roundId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {round.name || ROUND_TYPE_LABEL[round.type]}
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gán phòng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loại phòng cho phép: {round.roomTypes.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={suggestRooms.isPending}
            onClick={() => suggestRooms.mutate(roundId, { onSuccess: (data) => setSuggestionCount(data.length) })}
          >
            <Sparkles />
            {suggestRooms.isPending ? "Đang tính..." : "Gợi ý gán phòng"}
          </Button>
          <Button
            size="sm"
            disabled={applySuggestions.isPending || suggestionCount === null}
            onClick={() => applySuggestions.mutate(undefined, { onSuccess: () => setSuggestionCount(null) })}
          >
            {applySuggestions.isPending ? "Đang áp dụng..." : suggestionCount !== null ? `Áp dụng ${suggestionCount} gợi ý` : "Áp dụng gợi ý"}
          </Button>
        </div>
      </div>

      {!activeVersion && (
        <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Đợt này chưa có phương án lịch nào được kích hoạt — quay lại tab Xếp lịch để kích hoạt trước.
        </p>
      )}

      {activeVersion && dates.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {dates.map((date) => (
            <Button
              key={date}
              variant={date === activeDate ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate(date)}
            >
              {formatDate(date, "DD/MM")}
            </Button>
          ))}
        </div>
      )}

      {activeVersion && sessionsLoading && (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {sessionsError && <p className="mt-6 text-sm text-muted-foreground">Không tải được danh sách phiên.</p>}

      {activeVersion && activeDay && rooms && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border p-2 text-left font-medium text-muted-foreground">Phòng</th>
                {activeDay.slots.map((slot) => (
                  <th key={slot.id} className="border-b border-border p-2 text-left font-medium text-muted-foreground tabular-nums">
                    {slot.startTime}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="border-b border-border p-2 font-mono text-xs font-medium">{room.code}</td>
                  {activeDay.slots.map((slot) => {
                    const session = sessionsByCell.get(`${room.id}__${slot.id}`);
                    return (
                      <td key={slot.id} className="border-b border-border p-2">
                        {session ? (
                          <span className="inline-flex items-center rounded-md border border-border px-2 py-1 font-mono text-xs">
                            {session.group.code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeVersion && (
        <div className="mt-8">
          <p className="text-sm font-medium">Chưa gán ({unassigned.length})</p>
          {unassigned.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Mọi phiên trong ngày đã được gán phòng.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {unassigned.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setAssignTarget(s)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs",
                    "hover:bg-amber-500/20"
                  )}
                >
                  <StatusDot tone="amber" label={`${s.group.code} · ${s.startTime}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <AssignRoomDialog session={assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)} roundId={roundId} />
    </div>
  );
}
