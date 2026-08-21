"use client";

import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { formatInVietnamTime } from "@/lib/utils/formatDate";
import { SessionCard } from "./session-card";
import type { DisplaySession } from "./types";
import type { AssignableRoom, RoundSession } from "@/lib/api/services/fetchRoomAssignment";
import type { ScheduleVersionAssignment } from "@/lib/api/services/fetchScheduling";

/** RoundSession (API) → DisplaySession (dạng dùng cho DayGrid/SessionCard) — dùng chung cho Lịch đánh giá và panel Calendar ở Round Detail. */
export function toDisplaySession(session: RoundSession, rooms: AssignableRoom[]): DisplaySession {
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

/**
 * Solver assignment thô (1 version bất kỳ, kể cả DRAFT chưa activate) → DisplaySession — dùng cho
 * xem trước phương án nháp. Khác `toDisplaySession`: chưa có phòng thật (`room_id` luôn null ở
 * bước này), nên chỉ dùng được cho view "Danh sách", không đưa vào DayGrid (lưới CHIA CỘT theo
 * phòng — không có gì để plot khi chưa gán phòng).
 */
export function assignmentToDisplaySession(assignment: ScheduleVersionAssignment): DisplaySession {
  return {
    id: String(assignment.id),
    groupId: String(assignment.group_id),
    groupCode: assignment.group_code,
    projectTitle: null,
    date: formatInVietnamTime(assignment.start_at, "YYYY-MM-DD"),
    start: formatInVietnamTime(assignment.start_at, "HH:mm"),
    end: formatInVietnamTime(assignment.end_at, "HH:mm"),
    timeslotId: String(assignment.timeslot_id),
    roomId: assignment.room_id != null ? String(assignment.room_id) : null,
    roomCode: assignment.room_id != null ? `#${assignment.room_id}` : "Chưa gán",
    reviewers: assignment.reviewer_ids.map((id) => ({ id: String(id), name: assignment.reviewer_names[String(id)] ?? `#${id}` })),
    status: assignment.status,
  };
}

/** Dùng chung cho lọc "dimmed" trong DayGrid và view "Danh sách" ở calendar-page.tsx. */
export function matchesSearch(session: DisplaySession, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    session.groupCode.toLowerCase().includes(q) ||
    (session.projectTitle?.toLowerCase().includes(q) ?? false) ||
    session.reviewers.some((r) => r.name.toLowerCase().includes(q))
  );
}

/**
 * Lưới phòng × khung giờ cho một ngày — kéo-thả đổi phòng. Dùng chung cho trang Lịch đánh giá
 * (`/manager/calendar`) và panel Calendar trong Round Detail.
 */
export function DayGrid({
  sessions,
  rooms,
  timeslotRows,
  search,
  draggingId,
  hoveredCell,
  compact,
  readOnly,
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
  /** Xem trước phương án nháp — không kéo-thả/mở chi tiết được, phải kích hoạt trước. */
  readOnly?: boolean;
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
                    if (!readOnly && !session) {
                      e.preventDefault();
                      onCellDragOver({ roomId: room.id, start: slot.start });
                    }
                  }}
                  onDragLeave={() => onCellDragOver(null)}
                  onDrop={(e) => {
                    if (readOnly) return;
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
                        readOnly={readOnly}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", session.id);
                          onDragStart(session.id);
                        }}
                        onDragEnd={onDragEnd}
                        onClick={() => !readOnly && onSelect(session.id)}
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
