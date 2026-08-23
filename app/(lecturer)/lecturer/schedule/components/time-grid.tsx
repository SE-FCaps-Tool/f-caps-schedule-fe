"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { Check, Clock3, PauseCircle, UserX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { ROUND_TYPE_LABEL, roundKind, type LecturerSession } from "./types";
import { getStatusMeta, toneCardClass, toneDotClass } from "./tone";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SessionPopoverContent } from "./session-popover-content";

const START_MINUTES = 7 * 60;
const END_MINUTES = 18 * 60;
const PIXELS_PER_MINUTE = 64 / 60;
const GRID_PADDING = 14;
const GRID_HEIGHT = (END_MINUTES - START_MINUTES) * PIXELS_PER_MINUTE + GRID_PADDING * 2;
const MIN_EVENT_HEIGHT_PX = 30;
const LONG_DURATION_MINUTES = 60;

const STATUS_ICON: Record<LecturerSession["status"], typeof Clock3> = {
  PLANNED: Clock3,
  SCHEDULED: Clock3,
  ONGOING: Clock3,
  COMPLETED: Check,
  POSTPONED: PauseCircle,
  GROUP_ABSENT: UserX,
  CANCELLED: X,
};

function pixelsFromMinutes(minutes: number) {
  return GRID_PADDING + (minutes - START_MINUTES) * PIXELS_PER_MINUTE;
}

function minutesFromIso(iso: string) {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

interface Placement {
  session: LecturerSession;
  column: number;
  columnCount: number;
}

function layoutDaySessions(sessions: LecturerSession[]): Placement[] {
  const sorted = [...sessions].sort((a, b) => a.startAtIso.localeCompare(b.startAtIso));
  const placements: { session: LecturerSession; column: number }[] = [];
  const columnEnds: number[] = [];
  let clusterStartIndex = 0;
  let clusterEnd = -Infinity;
  const result: Placement[] = [];

  function closeCluster(fromIndex: number, toIndex: number) {
    if (toIndex <= fromIndex) return;
    const columnCount = Math.max(...placements.slice(fromIndex, toIndex).map((p) => p.column)) + 1;
    for (let i = fromIndex; i < toIndex; i++) {
      result.push({ ...placements[i], columnCount });
    }
  }

  sorted.forEach((session) => {
    const start = minutesFromIso(session.startAtIso);
    const end = minutesFromIso(session.endAtIso);

    if (start >= clusterEnd) {
      closeCluster(clusterStartIndex, placements.length);
      clusterStartIndex = placements.length;
      columnEnds.length = 0;
      clusterEnd = -Infinity;
    }

    let column = columnEnds.findIndex((endMinutes) => endMinutes <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }

    placements.push({ session, column });
    clusterEnd = Math.max(clusterEnd, end);
  });

  closeCluster(clusterStartIndex, placements.length);
  return result;
}

function TimeGutter() {
  const hourCount = (END_MINUTES - START_MINUTES) / 60 + 1;
  const hours = Array.from({ length: hourCount }, (_, index) => START_MINUTES + index * 60);

  return (
    <div className="relative w-14 shrink-0 border-r border-border" style={{ height: GRID_HEIGHT }}>
      {hours.map((minutes) => (
        <span
          key={minutes}
          className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground tabular-nums"
          style={{ top: pixelsFromMinutes(minutes) }}
        >
          {String(Math.floor(minutes / 60)).padStart(2, "0")}:00
        </span>
      ))}
    </div>
  );
}

function SessionCard({
  session,
  column,
  columnCount,
}: {
  session: LecturerSession;
  column: number;
  columnCount: number;
}) {
  const Icon = STATUS_ICON[session.status] ?? Clock3;
  const tone = getStatusMeta(session.status).tone;
  const start = minutesFromIso(session.startAtIso);
  const end = minutesFromIso(session.endAtIso);
  const top = pixelsFromMinutes(Math.max(start, START_MINUTES));
  const height = Math.max(pixelsFromMinutes(end) - top, MIN_EVENT_HEIGHT_PX);
  const leftPercent = (column / columnCount) * 100;
  const widthPercent = 100 / columnCount;
  const style: CSSProperties = {
    top: top + 2,
    height: height - 4,
    left: `calc(${leftPercent}% + ${column === 0 ? 4 : 2}px)`,
    width: `calc(${widthPercent}% - ${column === columnCount - 1 ? 8 : 6}px)`,
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            style={style}
            className={cn(
              "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg px-2.5 py-1 text-left transition-[color,background-color,transform] duration-150 ease-out will-change-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              toneCardClass[tone],
              session.status === "CANCELLED" && "opacity-60 line-through decoration-1"
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold tabular-nums">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{formatDate(session.startAtIso, "HH:mm")}</span>
          {roundKind(session.roundType) === "defense" && <span className="rotate-45 rounded-[1px] size-1.5 shrink-0 bg-current" aria-hidden />}
        </span>
        <span className="block truncate text-xs font-semibold">
          {ROUND_TYPE_LABEL[session.roundType]} <span className="font-normal opacity-80">· {session.groupCode}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={14} className="w-80 max-w-[calc(100vw-2rem)] rounded-lg p-3">
        <SessionPopoverContent session={session} />
      </PopoverContent>
    </Popover>
  );
}

function LongSessionCard({
  session,
  column,
  columnCount,
}: {
  session: LecturerSession;
  column: number;
  columnCount: number;
}) {
  const Icon = STATUS_ICON[session.status] ?? Clock3;
  const tone = getStatusMeta(session.status).tone;
  const start = minutesFromIso(session.startAtIso);
  const end = minutesFromIso(session.endAtIso);
  const top = pixelsFromMinutes(Math.max(start, START_MINUTES));
  const height = Math.max(pixelsFromMinutes(end) - top, MIN_EVENT_HEIGHT_PX);
  const leftPercent = (column / columnCount) * 100;
  const widthPercent = 100 / columnCount;
  const style: CSSProperties = {
    top: top + 2,
    height: height - 4,
    left: `calc(${leftPercent}% + 1px)`,
    width: `calc(${widthPercent}% - 2px)`,
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            style={style}
            className="group absolute flex flex-col items-start overflow-hidden rounded-md py-0.5 pl-1 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className="absolute top-6 bottom-1 left-3.25 w-px bg-border" aria-hidden />
        <span className="relative z-10 flex w-full min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "flex size-4.5 shrink-0 items-center justify-center rounded-full text-white",
              toneDotClass[tone]
            )}
          >
            <Icon className="size-2.5" />
          </span>
          <span className="min-w-0 flex-1 rounded px-1 py-0.5 transition-colors group-hover:bg-muted/60">
            <span className="block truncate text-xs font-semibold text-foreground">
              {ROUND_TYPE_LABEL[session.roundType]} · {session.groupCode}
            </span>
            <span className="block truncate text-[11px] tabular-nums text-muted-foreground">
              {formatDate(session.startAtIso, "HH:mm")} – {formatDate(session.endAtIso, "HH:mm")}
            </span>
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={14} className="w-80 max-w-[calc(100vw-2rem)] rounded-lg p-3">
        <SessionPopoverContent session={session} />
      </PopoverContent>
    </Popover>
  );
}

const WEEKDAY_LABEL = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export function TimeGrid({
  weekStartIso,
  sessions,
  todayIso,
}: {
  weekStartIso: string;
  sessions: LecturerSession[];
  todayIso: string;
}) {
  const [now, setNow] = useState(() => new Date(todayIso));
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartIso, i));
  const nowKey = formatDate(now, "YYYY-MM-DD");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES;
  const isCurrentWeekVisible = weekDays.some((day) => formatDate(day, "YYYY-MM-DD") === nowKey);
  const halfHourMarks = Array.from(
    { length: Math.floor((END_MINUTES - START_MINUTES) / 30) + 1 },
    (_, index) => START_MINUTES + index * 30
  );

  return (
    <div className="h-full overflow-x-auto rounded-lg border border-border">
      <div className="scrollbar-hide h-full overflow-y-auto">
        <div className="sticky top-0 z-20 flex border-b border-border bg-background">
          <div className="w-14 shrink-0 border-r border-border" />
          <div className="grid flex-1 grid-cols-[repeat(7,minmax(8rem,1fr))]">
            {weekDays.map((day, index) => {
              const key = formatDate(day, "YYYY-MM-DD");
              const isToday = nowKey === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center border-r border-border px-3 py-3 last:border-r-0",
                    isToday && "bg-primary/4"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">{WEEKDAY_LABEL[index]}</p>
                  <p
                    className={cn(
                      "mt-1 flex size-9 items-center justify-center rounded-full text-lg font-semibold tabular-nums",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {formatDate(day, "DD")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex" style={{ height: GRID_HEIGHT }}>
          <TimeGutter />
          <div className="relative min-w-0 flex-1">
            <div className="grid h-full grid-cols-[repeat(7,minmax(8rem,1fr))]">
              {weekDays.map((day) => {
                const key = formatDate(day, "YYYY-MM-DD");
                const daySessions = sessions.filter((s) => formatDate(s.startAtIso, "YYYY-MM-DD") === key);
                const isToday = nowKey === key;

                return (
                  <div key={key} className={cn("relative h-full border-r border-border last:border-r-0", isToday && "bg-primary/4")}>
                    {halfHourMarks.map((minutes) => (
                      <span
                        key={minutes}
                        className={cn(
                          "absolute inset-x-0 border-t",
                          minutes % 60 === 0 ? "border-border" : "border-dashed border-border/70"
                        )}
                        style={{ top: pixelsFromMinutes(minutes) }}
                        aria-hidden
                      />
                    ))}

                    {layoutDaySessions(daySessions).map(({ session, column, columnCount }) => {
                      const durationMinutes = minutesFromIso(session.endAtIso) - minutesFromIso(session.startAtIso);
                      const CardComponent = durationMinutes > LONG_DURATION_MINUTES ? LongSessionCard : SessionCard;
                      return (
                        <CardComponent key={session.id} session={session} column={column} columnCount={columnCount} />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {isCurrentWeekVisible && showNowLine && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5"
                style={{ top: pixelsFromMinutes(nowMinutes) }}
                aria-hidden
              >
                <span className="-ml-1 size-2 shrink-0 rounded-full bg-primary" />
                <span className="h-0.5 flex-1 bg-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
