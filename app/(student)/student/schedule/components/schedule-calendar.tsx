"use client";

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "motion/react";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Info,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ScheduleRound, ScheduleSlot, StudentScheduleData } from "./mock-data";
import { SessionDetailPanel } from "./session-detail-panel";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

const START_MINUTES = 7 * 60;
const END_MINUTES = 21 * 60;
const PIXELS_PER_MINUTE = 64 / 60;
const GRID_PADDING = 14;
const GRID_HEIGHT = (END_MINUTES - START_MINUTES) * PIXELS_PER_MINUTE + GRID_PADDING * 2;
const MIN_EVENT_HEIGHT_PX = 28;
const LONG_DURATION_MINUTES = 60;

function pixelsFromMinutes(minutes: number) {
  return GRID_PADDING + (minutes - START_MINUTES) * PIXELS_PER_MINUTE;
}

const roundStatusClass: Record<ScheduleRound["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground",
  OPEN_REGISTRATION: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  REGISTRATION_CLOSED: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
  SCHEDULING: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
  SCHEDULED: "bg-secondary text-secondary-foreground",
  PUBLISHED: "bg-primary text-primary-foreground",
  ONGOING: "bg-primary text-primary-foreground",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  LOCKED: "bg-muted text-muted-foreground",
};

const roundStatusIcon: Record<ScheduleRound["status"], typeof CheckCircle2> = {
  DRAFT: Circle,
  OPEN_REGISTRATION: CalendarCheck2,
  REGISTRATION_CLOSED: CalendarClock,
  SCHEDULING: CalendarClock,
  SCHEDULED: CalendarClock,
  PUBLISHED: CalendarClock,
  ONGOING: CalendarClock,
  COMPLETED: CheckCircle2,
  LOCKED: Circle,
};

const eventCardClass =
  "bg-amber-50 text-foreground ring-1 ring-amber-200/70 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-50 dark:ring-amber-400/20 dark:hover:bg-amber-500/15";

const eventIconClass: Record<ScheduleSlot["kind"], string> = {
  official: "text-primary",
  preferred: "text-primary",
  available: "text-sky-600 dark:text-sky-400",
  "not-selected": "text-muted-foreground",
  empty: "text-muted-foreground",
};

const eventIcon: Record<ScheduleSlot["kind"], typeof CalendarClock> = {
  official: CalendarClock,
  preferred: CheckCircle2,
  available: Circle,
  "not-selected": LockKeyhole,
  empty: Info,
};

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const dayIndex = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - dayIndex);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getSlots(round: ScheduleRound) {
  return round.days.flatMap((day) => day.sessions);
}

interface SlotPlacement {
  slot: ScheduleSlot;
  column: number;
  columnCount: number;
}

function layoutDaySlots(slots: ScheduleSlot[]): SlotPlacement[] {
  const sorted = [...slots].sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime));
  const placements: { slot: ScheduleSlot; column: number }[] = [];
  const columnEnds: number[] = [];
  let clusterStartIndex = 0;
  let clusterEnd = -Infinity;

  function closeCluster(fromIndex: number, toIndex: number) {
    const columnCount = Math.max(...placements.slice(fromIndex, toIndex).map((p) => p.column)) + 1;
    for (let i = fromIndex; i < toIndex; i++) {
      result.push({ ...placements[i], columnCount });
    }
  }

  const result: SlotPlacement[] = [];

  sorted.forEach((slot) => {
    const start = minutesFromTime(slot.startTime);
    const end = minutesFromTime(slot.endTime);

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

    placements.push({ slot, column });
    clusterEnd = Math.max(clusterEnd, end);
  });

  closeCluster(clusterStartIndex, placements.length);

  return result;
}

function getFirstSelectableSlot(round: ScheduleRound) {
  const slots = getSlots(round);
  return slots.find((slot) => slot.kind === "official" || slot.kind === "preferred") ?? slots[0];
}

function getWeekDays(round: ScheduleRound) {
  const firstDate = round.days[0]?.date ?? "2026-08-17";
  const weekStart = startOfWeek(parseDateOnly(firstDate));
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function MiniCalendar({
  visibleMonth,
  activeDate,
  daysWithSessions,
  todayKey,
}: {
  visibleMonth: Date;
  activeDate?: string;
  daysWithSessions: string[];
  todayKey: string;
}) {
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const weekdayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const days = [
    ...Array.from({ length: weekdayOffset }, (_, index) => ({ key: `blank-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{formatDate(monthStart, "MMMM YYYY")}</p>
        <CalendarDays className="size-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((item) => {
          if (!item.day) return <span key={item.key} className="aspect-square" />;

          const current = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), item.day);
          const currentKey = dateKey(current);
          const hasSession = daysWithSessions.includes(currentKey);
          const isActive = activeDate === currentKey;
          const isToday = todayKey === currentKey;

          return (
            <span
              key={item.key}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full text-xs font-medium tabular-nums",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : hasSession
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground",
                isToday && !isActive && "ring-2 ring-primary ring-inset text-primary",
                isToday && isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {item.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function RoundRail({
  rounds,
  activeRound,
  onSelect,
}: {
  rounds: ScheduleRound[];
  activeRound: ScheduleRound;
  onSelect: (round: ScheduleRound) => void;
}) {
  return (
    <div className="space-y-0.5" role="tablist" aria-label="Đợt đánh giá">
      {rounds.map((round) => {
        const isActive = activeRound.id === round.id;
        const Icon = roundStatusIcon[round.status];

        return (
          <button
            key={round.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(round)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive ? "bg-secondary" : "hover:bg-muted"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-secondary-foreground" : "text-muted-foreground"
              )}
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-sm font-medium",
                  isActive ? "text-secondary-foreground" : "text-foreground"
                )}
              >
                {round.label}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                roundStatusClass[round.status]
              )}
            >
              {round.statusLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "bg-primary text-primary-foreground" : "bg-background text-foreground ring-1 ring-border hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

const sessionPopoverContentClass =
  "w-[380px] max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto overflow-x-hidden rounded-lg p-0";

function CalendarEvent({
  slot,
  round,
  selected,
  onSelect,
  column,
  columnCount,
}: {
  slot: ScheduleSlot;
  round: ScheduleRound;
  selected: boolean;
  onSelect: () => void;
  column: number;
  columnCount: number;
}) {
  const Icon = eventIcon[slot.kind];
  const start = minutesFromTime(slot.startTime);
  const end = minutesFromTime(slot.endTime);
  const top = pixelsFromMinutes(Math.max(start, START_MINUTES));
  const height = Math.max(pixelsFromMinutes(end) - top, MIN_EVENT_HEIGHT_PX);
  const leftPercent = (column / columnCount) * 100;
  const widthPercent = 100 / columnCount;
  const viewTransitionStyle: CSSProperties = {
    top: top + 2,
    height: height - 4,
    left: `calc(${leftPercent}% + ${column === 0 ? 4 : 2}px)`,
    width: `calc(${widthPercent}% - ${column === columnCount - 1 ? 8 : 6}px)`,
    viewTransitionName: selected ? `student-schedule-event-${slot.id}` : undefined,
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            style={viewTransitionStyle}
            className={cn(
              "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg px-2.5 py-1 text-left transition-[color,background-color,transform] duration-150 ease-out will-change-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              eventCardClass,
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-card"
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold tabular-nums">
          <Icon className={cn("size-3.5 shrink-0", eventIconClass[slot.kind])} />
          <span className="truncate">
            {slot.startTime} - {slot.endTime}
          </span>
        </span>
        <span className="block truncate text-xs font-semibold">{slot.title}</span>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={14} className={sessionPopoverContentClass}>
        <SessionDetailPanel round={round} slot={slot} />
      </PopoverContent>
    </Popover>
  );
}

function LongCalendarEvent({
  slot,
  round,
  selected,
  onSelect,
  column,
  columnCount,
}: {
  slot: ScheduleSlot;
  round: ScheduleRound;
  selected: boolean;
  onSelect: () => void;
  column: number;
  columnCount: number;
}) {
  const Icon = eventIcon[slot.kind];
  const start = minutesFromTime(slot.startTime);
  const end = minutesFromTime(slot.endTime);
  const top = pixelsFromMinutes(Math.max(start, START_MINUTES));
  const height = Math.max(pixelsFromMinutes(end) - top, MIN_EVENT_HEIGHT_PX);
  const leftPercent = (column / columnCount) * 100;
  const widthPercent = 100 / columnCount;
  const viewTransitionStyle: CSSProperties = {
    top: top + 2,
    height: height - 4,
    left: `calc(${leftPercent}% + 1px)`,
    width: `calc(${widthPercent}% - 2px)`,
    viewTransitionName: selected ? `student-schedule-event-${slot.id}` : undefined,
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            style={viewTransitionStyle}
            className="group absolute flex flex-col items-start overflow-hidden rounded-md pl-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className="absolute left-3.25 top-6 bottom-1 w-px bg-primary" aria-hidden />
        <span className="relative z-10 flex w-full min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-offset-1 ring-offset-background",
              selected ? "ring-primary" : "ring-transparent"
            )}
          >
            <Icon className="size-2.5" />
          </span>
          <span className="min-w-0 flex-1 rounded px-1 py-0.5 transition-colors group-hover:bg-muted/60">
            <span className="block truncate text-xs font-semibold text-foreground">{slot.title}</span>
            <span className="block truncate text-[11px] tabular-nums text-muted-foreground">
              {slot.startTime} - {slot.endTime}
            </span>
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={14} className={sessionPopoverContentClass}>
        <SessionDetailPanel round={round} slot={slot} />
      </PopoverContent>
    </Popover>
  );
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

function WeekGrid({
  round,
  weekDays,
  eventsByDate,
  selectedSlot,
  now,
  onSelectSlot,
}: {
  round: ScheduleRound;
  weekDays: Date[];
  eventsByDate: Map<string, ScheduleSlot[]>;
  selectedSlot?: ScheduleSlot;
  now: Date;
  onSelectSlot: (slot: ScheduleSlot) => void;
}) {
  const halfHourMarks = Array.from(
    { length: Math.floor((END_MINUTES - START_MINUTES) / 30) + 1 },
    (_, index) => START_MINUTES + index * 30
  );
  const nowKey = dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES;
  const isCurrentWeekVisible = weekDays.some((day) => dateKey(day) === nowKey);

  return (
    <div className="hidden min-w-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex border-b border-border bg-background">
          <div className="w-14 shrink-0 border-r border-border" />
          <div className="grid flex-1 grid-cols-7">
            {weekDays.map((day) => {
              const key = dateKey(day);
              const isToday = nowKey === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center border-r border-border px-3 py-3 last:border-r-0",
                    isToday && "bg-primary/4"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">{formatDate(day, "ddd")}</p>
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
            <div className="grid h-full grid-cols-7">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const slots = eventsByDate.get(key) ?? [];
                const isToday = nowKey === key;

                return (
                  <div
                    key={key}
                    className={cn(
                      "relative h-full border-r border-border last:border-r-0",
                      isToday && "bg-primary/4"
                    )}
                  >
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

                    {layoutDaySlots(slots).map(({ slot, column, columnCount }) => {
                      const EventComponent =
                        slot.durationMinutes > LONG_DURATION_MINUTES ? LongCalendarEvent : CalendarEvent;

                      return (
                        <EventComponent
                          key={slot.id}
                          slot={slot}
                          round={round}
                          selected={selectedSlot?.id === slot.id}
                          onSelect={() => onSelectSlot(slot)}
                          column={column}
                          columnCount={columnCount}
                        />
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

function AgendaList({
  round,
  slots,
  selectedSlot,
  onSelectSlot,
}: {
  round: ScheduleRound;
  slots: ScheduleSlot[];
  selectedSlot?: ScheduleSlot;
  onSelectSlot: (slot: ScheduleSlot) => void;
}) {
  if (!slots.length) {
    return (
      <div className="rounded-xl bg-card p-6 text-center ring-1 ring-border">
        <CalendarDays className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold">Chưa có lịch trong đợt này</p>
        <p className="mt-1 text-sm text-muted-foreground">Lịch sẽ xuất hiện khi đợt được mở hoặc công bố.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:hidden">
      {slots.map((slot) => {
        const Icon = eventIcon[slot.kind];

        return (
          <Popover key={slot.id}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selectedSlot?.id === slot.id && "ring-2 ring-primary"
                  )}
                />
              }
            >
              <div className="w-14 shrink-0 text-center">
                <p className="text-xl font-semibold tabular-nums text-primary">{formatDate(slot.date, "DD")}</p>
                <p className="text-xs text-muted-foreground">{formatDate(slot.date, "ddd")}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Icon className="size-3.5" />
                  {slot.startTime} - {slot.endTime}
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{slot.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {slot.room ? `Phòng ${slot.room}` : slot.statusLabel}
                </p>
              </div>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="center" sideOffset={14} className={sessionPopoverContentClass}>
              <SessionDetailPanel round={round} slot={slot} />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

export function ScheduleCalendar({ data }: { data: StudentScheduleData }) {
  const reduceMotion = useReducedMotion();
  const [activeRoundId, setActiveRoundId] = useState(data.initialRoundId);
  const [selectedSlotId, setSelectedSlotId] = useState(data.nextSessionId);
  const [visibleWeekStartKey, setVisibleWeekStartKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const activeRound = useMemo(
    () => data.rounds.find((round) => round.id === activeRoundId) ?? data.rounds[0],
    [activeRoundId, data.rounds]
  );
  const activeSlots = useMemo(
    () => getSlots(activeRound).sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [activeRound]
  );
  const selectedSlot = activeSlots.find((slot) => slot.id === selectedSlotId) ?? getFirstSelectableSlot(activeRound);
  const roundWeekDays = useMemo(() => getWeekDays(activeRound), [activeRound]);
  const visibleWeekStart = visibleWeekStartKey ? parseDateOnly(visibleWeekStartKey) : roundWeekDays[0];
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(visibleWeekStart, index)),
    [visibleWeekStart]
  );
  const daysWithSessions = activeRound.days.map((day) => day.date);
  const activeDate = selectedSlot?.date;
  const visibleMonth = activeDate ? parseDateOnly(activeDate) : weekDays[0];
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    activeSlots.forEach((slot) => {
      const slots = map.get(slot.date) ?? [];
      slots.push(slot);
      map.set(slot.date, slots);
    });
    return map;
  }, [activeSlots]);
  const rangeLabel = `${formatDate(weekDays[0], "DD/MM")} - ${formatDate(weekDays[6], "DD/MM/YYYY")}`;

  function runWithViewTransition(update: () => void) {
    const doc = document as ViewTransitionDocument;

    if (!reduceMotion && doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(update);
      });
      return;
    }

    update();
  }

  function selectRound(round: ScheduleRound) {
    const firstSlot = getFirstSelectableSlot(round);
    const firstWeek = getWeekDays(round)[0];

    runWithViewTransition(() => {
      setActiveRoundId(round.id);
      setSelectedSlotId(firstSlot?.id ?? "");
      setVisibleWeekStartKey(dateKey(firstWeek));
    });
  }

  function selectSlot(slot: ScheduleSlot) {
    runWithViewTransition(() => {
      setSelectedSlotId(slot.id);
      setVisibleWeekStartKey(dateKey(startOfWeek(parseDateOnly(slot.date))));
    });
  }

  function shiftWeek(days: number) {
    setVisibleWeekStartKey(dateKey(addDays(visibleWeekStart, days)));
  }

  function jumpToToday() {
    setVisibleWeekStartKey(dateKey(startOfWeek(new Date())));
  }

  return (
    <section className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-4 md:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <CalendarCheck2 className="size-3.5" />
              {data.semester.code}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", roundStatusClass[activeRound.status])}>
              {activeRound.statusLabel}
            </span>
            {activeRound.summaries.map((summary) => (
              <span
                key={`${activeRound.id}-${summary.label}`}
                className="hidden items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex"
                title={summary.detail}
              >
                {summary.value}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">Lịch nhóm {data.group.code}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton ariaLabel="Tuần trước" onClick={() => shiftWeek(-7)}>
            <ChevronLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={jumpToToday}>Hôm nay</ToolbarButton>
          <ToolbarButton ariaLabel="Tuần sau" onClick={() => shiftWeek(7)}>
            <ChevronRight className="size-4" />
          </ToolbarButton>
          <div className="min-w-40 rounded-lg bg-muted px-3 py-2 text-sm font-semibold tabular-nums">
            {rangeLabel}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="space-y-5 border-b border-border p-4 md:px-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <MiniCalendar
            visibleMonth={visibleMonth}
            activeDate={activeDate}
            daysWithSessions={daysWithSessions}
            todayKey={dateKey(now)}
          />

          <div>
            <p className="mb-2 text-sm font-semibold">Đợt đánh giá</p>
            <RoundRail rounds={data.rounds} activeRound={activeRound} onSelect={selectRound} />
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Lịch đang xem
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" />
                Phiên chính thức
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[oklch(0.96_0.045_72)] ring-1 ring-primary/25" />
                Slot leader chọn
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-sky-500" />
                Slot còn chỗ
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-pretty">{data.group.projectTitleEn}</p>
            <p className="mt-3 text-xs text-muted-foreground">{data.semester.timezoneLabel}</p>
          </div>
        </aside>

        <main className="min-w-0 p-4 md:px-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <WeekGrid
            round={activeRound}
            weekDays={weekDays}
            eventsByDate={eventsByDate}
            selectedSlot={selectedSlot}
            now={now}
            onSelectSlot={selectSlot}
          />
          <AgendaList
            round={activeRound}
            slots={activeSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={selectSlot}
          />
        </main>
      </div>
    </section>
  );
}
