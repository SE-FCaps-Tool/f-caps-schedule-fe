"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/shared/date-field";
import { TimeField } from "@/components/shared/time-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";

export interface RoundTimeslotDraft {
  startTime: string;
  endTime: string;
}

export interface DayDraft {
  date: string;
  slots: RoundTimeslotDraft[];
}

export interface DeadlineDraft {
  date: string;
  time: string;
}

export type ShiftBase = "07:00" | "07:30";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const TIMELINE_START_MINUTES = 7 * 60; // 07:00
const TIMELINE_END_MINUTES = 22 * 60 + 30; // 22:30
const TOTAL_TIMELINE_MINUTES = TIMELINE_END_MINUTES - TIMELINE_START_MINUTES; // 930 mins
const PX_PER_MINUTE = 1.0; // 1 min = 1px -> 60px/hour
const TIMELINE_TOP_OFFSET = 32; // Offset from top to give space for 07:00 label
const TIMELINE_BOTTOM_OFFSET = 32; // Offset at bottom
const TIMELINE_HEIGHT = TIMELINE_TOP_OFFSET + TOTAL_TIMELINE_MINUTES * PX_PER_MINUTE + TIMELINE_BOTTOM_OFFSET; // 994px
const SNAP_MINUTES = 15;

function getTop(minutes: number): number {
  return TIMELINE_TOP_OFFSET + (minutes - TIMELINE_START_MINUTES) * PX_PER_MINUTE;
}

function getMinutesFromOffset(offsetY: number): number {
  return snapToInterval(((offsetY - TIMELINE_TOP_OFFSET) / PX_PER_MINUTE) + TIMELINE_START_MINUTES);
}

export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function snapToInterval(minutes: number, interval = SNAP_MINUTES): number {
  return Math.round(minutes / interval) * interval;
}

function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDaysStr(dateStr: string, n: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

function todayKey(): string {
  return toDateKey(new Date());
}

function getMonday(dateStr: string): Date {
  const d = parseDateOnly(dateStr);
  const day = (d.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  d.setDate(d.getDate() - day);
  return d;
}

function getWeekColumns(startDate: string, endDate: string): string[][] {
  if (!startDate || !endDate) return [];
  const startD = getMonday(startDate);
  const endD = parseDateOnly(endDate);

  const weeks: string[][] = [];
  const curMonday = new Date(startD);

  let safeGuard = 0;
  while (curMonday <= endD && safeGuard < 100) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curMonday);
      d.setDate(d.getDate() + i);
      week.push(toDateKey(d));
    }
    weeks.push(week);
    curMonday.setDate(curMonday.getDate() + 7);
    safeGuard++;
  }
  return weeks;
}

interface MonthCell {
  date: Date;
  inCurrentMonth: boolean;
}

function getMonthMatrix(year: number, month: number): MonthCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = startWeekday; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inCurrentMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, month + 1, trailing),
      inCurrentMonth: false,
    });
    trailing++;
  }
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 3660) {
    out.push(cur);
    cur = addDaysStr(cur, 1);
    guard++;
  }
  return out;
}

function slotsOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

export function getStandardUniversitySlots(shiftBase: ShiftBase = "07:00"): Array<{
  slotNumber: number;
  label: string;
  startMinutes: number;
  endMinutes: number;
  period: "morning" | "afternoon" | "evening";
}> {
  if (shiftBase === "07:30") {
    return [
      { slotNumber: 1, label: "SLOT 1", startMinutes: 7 * 60 + 30, endMinutes: 9 * 60 + 45, period: "morning" },
      { slotNumber: 2, label: "SLOT 2", startMinutes: 10 * 60, endMinutes: 12 * 60 + 15, period: "morning" },
      { slotNumber: 3, label: "SLOT 3", startMinutes: 13 * 60, endMinutes: 15 * 60 + 15, period: "afternoon" },
      { slotNumber: 4, label: "SLOT 4", startMinutes: 15 * 60 + 30, endMinutes: 17 * 60 + 45, period: "afternoon" },
      { slotNumber: 5, label: "SLOT 5", startMinutes: 18 * 60, endMinutes: 20 * 60 + 15, period: "evening" },
      { slotNumber: 6, label: "SLOT 6", startMinutes: 20 * 60 + 30, endMinutes: 22 * 60 + 45, period: "evening" },
    ];
  }
  return [
    { slotNumber: 1, label: "SLOT 1", startMinutes: 7 * 60, endMinutes: 9 * 60 + 15, period: "morning" },
    { slotNumber: 2, label: "SLOT 2", startMinutes: 9 * 60 + 30, endMinutes: 11 * 60 + 45, period: "morning" },
    { slotNumber: 3, label: "SLOT 3", startMinutes: 12 * 60 + 30, endMinutes: 14 * 60 + 45, period: "afternoon" },
    { slotNumber: 4, label: "SLOT 4", startMinutes: 15 * 60, endMinutes: 17 * 60 + 15, period: "afternoon" },
    { slotNumber: 5, label: "SLOT 5", startMinutes: 17 * 60 + 30, endMinutes: 19 * 60 + 45, period: "afternoon" },
    { slotNumber: 6, label: "SLOT 6", startMinutes: 20 * 60, endMinutes: 22 * 60 + 15, period: "evening" },
  ];
}

interface RoundScheduleCalendarProps {
  duration: number;
  startDate: string;
  endDate: string;
  pendingStart: string | null;
  pendingEnd: string | null;
  confirmOpen: boolean;
  onHeaderClickRange: (date: string) => void;
  onConfirmRange: () => void;
  onCancelRangeConfirm: () => void;
  onResetRange: () => void;
  registrationDeadline: DeadlineDraft | null;
  onRegistrationDeadlineChange: (value: DeadlineDraft | null) => void;
  days: DayDraft[];
  onAddSlot: (date: string, startTime: string, customEndTime?: string) => void;
  onUpdateSlot?: (date: string, index: number, updated: RoundTimeslotDraft) => void;
  onRemoveSlot: (date: string, index: number) => void;
  onApplyPreset?: (dates: string[], preset: "morning" | "afternoon" | "evening" | "full") => void;
  onClearSlots?: (dates?: string[]) => void;
  shiftBase: ShiftBase;
  onShiftBaseChange: (shiftBase: ShiftBase) => void;
}

export function RoundScheduleCalendar({
  duration,
  startDate,
  endDate,
  pendingStart,
  pendingEnd,
  confirmOpen,
  onHeaderClickRange,
  onConfirmRange,
  onCancelRangeConfirm,
  onResetRange,
  registrationDeadline,
  onRegistrationDeadlineChange,
  days,
  onAddSlot,
  onUpdateSlot,
  onRemoveSlot,
  onApplyPreset,
  onClearSlots,
  shiftBase,
  onShiftBaseChange,
}: RoundScheduleCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Edit popover state
  const [editingSlot, setEditingSlot] = useState<{
    date: string;
    index: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Dragging / Resizing State
  const [activeDrag, setActiveDrag] = useState<{
    type: "move" | "resize-top" | "resize-bottom";
    date: string;
    index: number;
    initialStartMin: number;
    initialEndMin: number;
    currentStartMin: number;
    currentEndMin: number;
    startY: number;
    hasConflict: boolean;
  } | null>(null);

  // Ghost slot for click-to-add preview
  const [hoverTrack, setHoverTrack] = useState<{
    date: string;
    startMin: number;
  } | null>(null);

  const phase = !startDate || !endDate ? "range" : "slots";

  const weeksOfRange = phase !== "range" ? getWeekColumns(startDate, endDate) : [];
  const currentWeekColumns = weeksOfRange[currentWeekIndex] || [];
  const totalWeeks = weeksOfRange.length;

  const [prevRange, setPrevRange] = useState({ startDate, endDate });
  if (startDate !== prevRange.startDate || endDate !== prevRange.endDate) {
    setPrevRange({ startDate, endDate });
    setCurrentWeekIndex(0);
  }

  const dayByDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const today = todayKey();
  const isCurrentMonthView =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  function goMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const previewEnd = pendingEnd ?? hoverDate ?? undefined;
  const weeks = getMonthMatrix(viewYear, viewMonth);

  // Drag and drop event handling
  const handlePointerDownSlot = (
    e: React.PointerEvent,
    type: "move" | "resize-top" | "resize-bottom",
    date: string,
    index: number,
    slot: RoundTimeslotDraft
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startMin = timeToMinutes(slot.startTime);
    const endMin = timeToMinutes(slot.endTime);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setActiveDrag({
      type,
      date,
      index,
      initialStartMin: startMin,
      initialEndMin: endMin,
      currentStartMin: startMin,
      currentEndMin: endMin,
      startY: e.clientY,
      hasConflict: false,
    });
  };

  const handlePointerMoveSlot = useCallback(
    (e: React.PointerEvent) => {
      if (!activeDrag) return;

      const deltaY = e.clientY - activeDrag.startY;
      const deltaMinutes = Math.round(deltaY / (SNAP_MINUTES * PX_PER_MINUTE)) * SNAP_MINUTES;

      let nextStart = activeDrag.initialStartMin;
      let nextEnd = activeDrag.initialEndMin;

      if (activeDrag.type === "move") {
        const slotDur = activeDrag.initialEndMin - activeDrag.initialStartMin;
        nextStart = snapToInterval(
          Math.max(
            TIMELINE_START_MINUTES,
            Math.min(TIMELINE_END_MINUTES - slotDur, activeDrag.initialStartMin + deltaMinutes)
          )
        );
        nextEnd = nextStart + slotDur;
      } else if (activeDrag.type === "resize-top") {
        nextStart = snapToInterval(
          Math.max(
            TIMELINE_START_MINUTES,
            Math.min(activeDrag.initialEndMin - 15, activeDrag.initialStartMin + deltaMinutes)
          )
        );
      } else if (activeDrag.type === "resize-bottom") {
        nextEnd = snapToInterval(
          Math.max(
            activeDrag.initialStartMin + 15,
            Math.min(TIMELINE_END_MINUTES, activeDrag.initialEndMin + deltaMinutes)
          )
        );
      }

      // Check conflict with other slots in this day
      const dayDraft = dayByDate.get(activeDrag.date);
      const otherSlots = dayDraft
        ? dayDraft.slots.filter((_, i) => i !== activeDrag.index)
        : [];

      const candidateStr = {
        startTime: minutesToTime(nextStart),
        endTime: minutesToTime(nextEnd),
      };

      const conflict = otherSlots.some((s) => slotsOverlap(s, candidateStr));

      setActiveDrag((prev) =>
        prev
          ? {
              ...prev,
              currentStartMin: nextStart,
              currentEndMin: nextEnd,
              hasConflict: conflict,
            }
          : null
      );
    },
    [activeDrag, dayByDate]
  );

  const handlePointerUpSlot = useCallback(
    (e: React.PointerEvent) => {
      if (!activeDrag) return;

      try {
        const target = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }

      const { date, index, currentStartMin, currentEndMin, hasConflict } = activeDrag;

      if (!hasConflict && (currentStartMin !== activeDrag.initialStartMin || currentEndMin !== activeDrag.initialEndMin)) {
        const updated: RoundTimeslotDraft = {
          startTime: minutesToTime(currentStartMin),
          endTime: minutesToTime(currentEndMin),
        };
        if (onUpdateSlot) {
          onUpdateSlot(date, index, updated);
        }
      }

      setActiveDrag(null);
    },
    [activeDrag, onUpdateSlot]
  );

  // Time ruler hours (07:00, 08:00, ... 22:00)
  const timeRulerHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = 7; h <= 22; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Banner / Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock3 className="size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-pretty font-medium text-foreground">
            {phase === "range"
              ? "Bấm chọn ngày bắt đầu, rồi ngày kết thúc đợt — dùng nút để xem tháng khác."
              : "Kéo thả để dời giờ hoặc kéo cạnh để đổi thời lượng. Bấm vào slot để chỉnh giờ chính xác."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {phase === "range" && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium tabular-nums text-foreground capitalize">
                {formatDate(
                  `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`,
                  "MMMM YYYY"
                )}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={isCurrentMonthView}
                  onClick={() => goMonth(-1)}
                  aria-label="Tháng trước"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => goMonth(1)}
                  aria-label="Tháng sau"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
          {phase !== "range" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetRange}
            >
              Đổi khoảng ngày
            </Button>
          )}
        </div>
      </div>

      {/* PHASE 1: Date Range Month Calendar */}
      {phase === "range" && (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="grid shrink-0 grid-cols-7 gap-1 pb-1.5 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div
            className="grid min-h-0 flex-1 grid-cols-7 gap-1"
            style={{
              gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
            }}
          >
            {weeks.flatMap((week, weekIndex) =>
              week.map((cell, dateIndex) => {
                const date = toDateKey(cell.date);
                const isPast = date < today;
                const isToday = date === today;
                const isPendingStart = date === pendingStart;
                const isInPreview =
                  pendingStart != null &&
                  previewEnd != null &&
                  date >= pendingStart &&
                  date <= previewEnd;
                const selectable = !isPast;

                return (
                  <button
                    key={`${weekIndex}-${dateIndex}-${date}`}
                    type="button"
                    disabled={!selectable}
                    onClick={() => {
                      if (!cell.inCurrentMonth) {
                        setViewYear(cell.date.getFullYear());
                        setViewMonth(cell.date.getMonth());
                      }
                      onHeaderClickRange(date);
                    }}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() =>
                      setHoverDate((d) => (d === date ? null : d))
                    }
                    className={cn(
                      "flex min-h-0 items-center justify-center rounded-lg transition-colors",
                      !selectable && "cursor-not-allowed",
                      selectable && "cursor-pointer hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors sm:size-10 sm:text-base",
                        !cell.inCurrentMonth &&
                          selectable &&
                          "text-muted-foreground/50",
                        !cell.inCurrentMonth &&
                          !selectable &&
                          "text-muted-foreground/25",
                        cell.inCurrentMonth &&
                          !selectable &&
                          "text-muted-foreground/30",
                        cell.inCurrentMonth &&
                          selectable &&
                          !isPendingStart &&
                          "text-foreground",
                        isInPreview &&
                          !isPendingStart &&
                          "bg-primary/10 text-primary",
                        isPendingStart && "bg-primary text-primary-foreground",
                        !isPendingStart && isToday && "ring-2 ring-sky-500"
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PHASE 2: Timeline Schedule View */}
      {phase !== "range" && currentWeekColumns.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentWeekIndex === 0}
              onClick={() => setCurrentWeekIndex((i) => i - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium text-center px-2">
              Tuần {currentWeekIndex + 1}/{totalWeeks}
              {currentWeekColumns.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal ml-2 hidden sm:inline-block">
                  ({formatDate(currentWeekColumns[0], "DD/MM")} –{" "}
                  {formatDate(currentWeekColumns[6], "DD/MM/YYYY")})
                </span>
              )}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentWeekIndex === totalWeeks - 1}
              onClick={() => setCurrentWeekIndex((i) => i + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2 border-r border-border pr-4">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                Giờ ca sáng:
              </span>
              <div className="flex items-center rounded-md border border-border p-0.5 bg-background">
                <button
                  type="button"
                  onClick={() => onShiftBaseChange("07:00")}
                  className={cn(
                    "px-2 py-1 text-[11px] font-medium rounded-sm transition-colors",
                    shiftBase === "07:00"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  07:00
                </button>
                <button
                  type="button"
                  onClick={() => onShiftBaseChange("07:30")}
                  className={cn(
                    "px-2 py-1 text-[11px] font-medium rounded-sm transition-colors",
                    shiftBase === "07:30"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  07:30
                </button>
              </div>
            </div>

            <span className="text-xs font-medium text-muted-foreground mr-1 hidden lg:inline">
              Thao tác tuần:
            </span>
            {onApplyPreset && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onApplyPreset(
                      currentWeekColumns.filter(
                        (d) => d >= startDate && d <= endDate
                      ),
                      "morning"
                    )
                  }
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sun className="size-3.5 text-amber-500" />
                  + Ca sáng
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onApplyPreset(
                      currentWeekColumns.filter(
                        (d) => d >= startDate && d <= endDate
                      ),
                      "afternoon"
                    )
                  }
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sunset className="size-3.5 text-orange-500" />
                  + Ca chiều
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onApplyPreset(
                      currentWeekColumns.filter(
                        (d) => d >= startDate && d <= endDate
                      ),
                      "evening"
                    )
                  }
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Moon className="size-3.5 text-indigo-500" />
                  + Ca tối
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onApplyPreset(
                      currentWeekColumns.filter(
                        (d) => d >= startDate && d <= endDate
                      ),
                      "full"
                    )
                  }
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  + Cả ngày
                </Button>
              </>
            )}
            {onClearSlots && days.length > 0 && (
              <div className="ml-2 border-l border-border pl-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onClearSlots()}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-1.5 size-3" />
                  Xoá tất cả
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Drag-and-Drop Timeline Container */}
      {phase !== "range" && (
        <div
          className="relative flex-1 overflow-auto select-none bg-background/50"
          onPointerMove={handlePointerMoveSlot}
          onPointerUp={handlePointerUpSlot}
        >
          <div className="min-w-[1050px] w-full">
            {/* Sticky Header: Day Columns */}
            <div className="sticky top-0 z-30 flex w-full border-b border-border bg-card/95 backdrop-blur-sm shadow-xs">
              {/* Left Corner: Time Header */}
              <div className="sticky left-0 z-40 flex items-center justify-center shrink-0 border-r border-border bg-muted/50 w-[110px] px-3 py-3 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Thời gian
                </span>
              </div>

              {/* Day Headers */}
              <div className="flex flex-1 min-w-0">
                {currentWeekColumns.map((date, index) => {
                  const isToday = date === today;
                  const draft = dayByDate.get(date);
                  const isDeadlineDay = registrationDeadline?.date === date;
                  const isOutOfRange = date < startDate || date > endDate;

                  return (
                    <div
                      key={date}
                      className={cn(
                        "flex flex-1 min-w-[125px] flex-col items-center justify-center gap-1 border-r border-border px-2 py-2.5 bg-card transition-colors relative",
                        isToday && "bg-amber-500/5",
                        isOutOfRange && "bg-muted/30 opacity-60"
                      )}
                    >
                      {isDeadlineDay && registrationDeadline && (
                        <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-wide",
                            isOutOfRange
                              ? "text-muted-foreground/60"
                              : isToday
                              ? "text-primary font-extrabold"
                              : "text-muted-foreground"
                          )}
                        >
                          {WEEKDAY_LABELS[index]}
                        </span>
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-all",
                            isDeadlineDay &&
                              "bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30",
                            !isDeadlineDay &&
                              isToday &&
                              "bg-primary text-primary-foreground shadow-xs font-extrabold",
                            !isDeadlineDay &&
                              !isToday &&
                              (isOutOfRange
                                ? "text-muted-foreground/60"
                                : "text-foreground")
                          )}
                        >
                          {formatDate(date, "DD")}
                        </span>
                      </div>

                      {isOutOfRange ? (
                        <span className="rounded-md bg-muted/60 px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground/60">
                          Ngoài đợt
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[10px] font-semibold transition-colors",
                              (draft?.slots.length ?? 0) > 0
                                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {draft?.slots.length ?? 0} slot
                          </span>
                          {onApplyPreset && (
                            <Popover>
                              <PopoverTrigger
                                className="flex size-4.5 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all"
                                title="Thao tác nhanh cho ngày này"
                              >
                                <Plus className="size-2.5" />
                              </PopoverTrigger>
                              <PopoverContent
                                align="center"
                                className="w-52 p-2 text-xs shadow-lg"
                              >
                                <div className="space-y-1">
                                  <p className="px-2 py-1 font-semibold text-foreground text-xs border-b border-border pb-1 mb-1">
                                    {formatDate(date, "dddd, DD/MM/YYYY")}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApplyPreset([date], "morning")
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                  >
                                    <Sun className="size-3.5 text-amber-500" />
                                    + Ca sáng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApplyPreset([date], "afternoon")
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                  >
                                    <Sunset className="size-3.5 text-orange-500" />
                                    + Ca chiều
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApplyPreset([date], "evening")
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                  >
                                    <Moon className="size-3.5 text-indigo-500" />
                                    + Ca tối
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApplyPreset([date], "full")
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                  >
                                    <Sparkles className="size-3.5 text-primary" />
                                    + Cả ngày
                                  </button>
                                  {(draft?.slots.length ?? 0) > 0 &&
                                    onClearSlots && (
                                      <div className="border-t border-border pt-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => onClearSlots([date])}
                                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                          <Trash2 className="size-3.5" />
                                          Xoá tất cả slot ngày này
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body (Grid with Left Time Ruler + Day Columns) */}
            <div
              className="relative flex w-full"
              style={{ height: `${TIMELINE_HEIGHT}px` }}
            >
              {/* Left Gutter: Time Axis */}
              <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-card w-[110px] shadow-[1px_0_0_0_rgba(0,0,0,0.05)] select-none">
                {timeRulerHours.map((hour) => {
                  const top = getTop(hour * 60);

                  return (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 flex items-center justify-end pr-2.5"
                      style={{ top: `${top}px` }}
                    >
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground/80 -translate-y-1/2">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                      <div className="absolute right-0 w-2 border-t border-border" />
                    </div>
                  );
                })}

                {/* Period Labels in gutter */}
                <div
                  className="absolute left-1.5 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                  style={{ top: `${getTop(7 * 60) + 4}px` }}
                >
                  <Sun className="size-2.5 shrink-0" /> Sáng
                </div>
                <div
                  className="absolute left-1.5 text-[9px] font-bold text-muted-foreground bg-muted/80 border border-border/60 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                  style={{ top: `${getTop(11 * 60 + 45) + 4}px` }}
                >
                  🍽️ Trưa
                </div>
                <div
                  className="absolute left-1.5 text-[9px] font-bold text-orange-800 dark:text-orange-300 bg-orange-500/15 border border-orange-500/25 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                  style={{ top: `${getTop(12 * 60 + 30) + 4}px` }}
                >
                  <Sunset className="size-2.5 shrink-0" /> Chiều
                </div>
                <div
                  className="absolute left-1.5 text-[9px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                  style={{ top: `${getTop(17 * 60 + 30) + 4}px` }}
                >
                  <Moon className="size-2.5 shrink-0" /> Tối
                </div>
              </div>

              {/* Day Track Columns */}
              <div className="flex flex-1 min-w-0 relative">
                {/* Horizontal Grid lines spanning all columns */}
                {timeRulerHours.map((hour) => {
                  const top = getTop(hour * 60);
                  const halfTop = getTop(hour * 60 + 30);

                  return (
                    <React.Fragment key={`grid-${hour}`}>
                      {/* Hour solid line */}
                      <div
                        className="pointer-events-none absolute inset-x-0 border-t border-border/50"
                        style={{ top: `${top}px` }}
                      />
                      {/* 30-min dashed line */}
                      <div
                        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/30"
                        style={{ top: `${halfTop}px` }}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Lunch break shaded band (11:45 to 12:30) */}
                <div
                  className="pointer-events-none absolute inset-x-0 bg-muted/25 border-y border-dashed border-border/60 z-0 flex items-center justify-center opacity-75"
                  style={{
                    top: `${getTop(11 * 60 + 45)}px`,
                    height: `${45 * PX_PER_MINUTE}px`,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.02) 6px, rgba(0,0,0,0.02) 12px)",
                  }}
                >
                  <span className="text-[10px] font-medium text-muted-foreground/75 bg-background/80 px-2 py-0.5 rounded-full border border-border/40 backdrop-blur-xs">
                    🍽️ Nghỉ trưa (11:45 – 12:30)
                  </span>
                </div>

                {/* Day Columns */}
                {currentWeekColumns.map((date) => {
                  const isOutOfRange = date < startDate || date > endDate;
                  const dayDraft = dayByDate.get(date);
                  const slots = dayDraft?.slots || [];

                  return (
                    <div
                      key={date}
                      className={cn(
                        "relative flex-1 min-w-[125px] border-r border-border h-full transition-colors",
                        isOutOfRange
                          ? "bg-muted/30 cursor-not-allowed opacity-50"
                          : "hover:bg-primary/[0.015] cursor-pointer"
                      )}
                      onPointerEnter={() => {
                        if (!isOutOfRange && !activeDrag) {
                          // Hover setup
                        }
                      }}
                      onPointerMove={(e) => {
                        if (isOutOfRange || activeDrag) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetY = e.clientY - rect.top;
                        const min = Math.max(
                          TIMELINE_START_MINUTES,
                          Math.min(
                            TIMELINE_END_MINUTES - (duration > 0 ? duration : 60),
                            getMinutesFromOffset(offsetY)
                          )
                        );
                        setHoverTrack({ date, startMin: min });
                      }}
                      onPointerLeave={() => {
                        setHoverTrack(null);
                      }}
                      onClick={(e) => {
                        if (isOutOfRange || activeDrag) return;
                        // Avoid trigger if clicked on child button
                        if ((e.target as HTMLElement).closest(".slot-card")) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetY = e.clientY - rect.top;
                        const clickedMin = getMinutesFromOffset(offsetY);
                        const dur = duration > 0 ? duration : 90;
                        const start = minutesToTime(clickedMin);
                        const end = minutesToTime(clickedMin + dur);

                        // Check overlap before adding
                        const overlap = slots.some((s) =>
                          slotsOverlap(s, { startTime: start, endTime: end })
                        );
                        if (!overlap) {
                          onAddSlot(date, start, end);
                        }
                      }}
                    >
                      {/* Ghost Slot on Hover for quick creation */}
                      {!isOutOfRange &&
                        !activeDrag &&
                        hoverTrack &&
                        hoverTrack.date === date && (
                          <div
                            className="pointer-events-none absolute inset-x-1 rounded-md border-2 border-dashed border-primary/40 bg-primary/10 flex flex-col justify-center items-center z-10 animate-fade-in transition-all"
                            style={{
                              top: `${getTop(hoverTrack.startMin)}px`,
                              height: `${(duration > 0 ? duration : 90) * PX_PER_MINUTE}px`,
                            }}
                          >
                            <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                              <Plus className="size-3" /> Bấm để thêm slot
                            </span>
                            <span className="text-[10px] font-medium text-primary/80 tabular-nums">
                              {minutesToTime(hoverTrack.startMin)} –{" "}
                              {minutesToTime(
                                hoverTrack.startMin + (duration > 0 ? duration : 90)
                              )}
                            </span>
                          </div>
                        )}

                      {/* Render Actual Slots for this Day */}
                      {slots.map((slot, sIdx) => {
                        const isBeingDragged =
                          activeDrag &&
                          activeDrag.date === date &&
                          activeDrag.index === sIdx;

                        const startMin = isBeingDragged
                          ? activeDrag.currentStartMin
                          : timeToMinutes(slot.startTime);
                        const endMin = isBeingDragged
                          ? activeDrag.currentEndMin
                          : timeToMinutes(slot.endTime);

                        const slotDuration = endMin - startMin;
                        const top = getTop(startMin);
                        const height = Math.max(30, slotDuration * PX_PER_MINUTE);

                        const hasConflict = isBeingDragged && activeDrag.hasConflict;

                        return (
                          <div
                            key={`${slot.startTime}-${slot.endTime}-${sIdx}`}
                            className={cn(
                              "slot-card absolute inset-x-1 rounded-lg border flex flex-col justify-between overflow-hidden shadow-xs transition-shadow group z-10",
                              isBeingDragged
                                ? hasConflict
                                  ? "border-destructive bg-destructive/15 text-destructive ring-2 ring-destructive/40 shadow-lg z-30 opacity-95"
                                  : "border-primary bg-primary/20 text-primary ring-2 ring-primary/40 shadow-lg z-30 opacity-95"
                                : "border-primary/40 bg-primary/10 text-primary hover:border-primary hover:bg-primary/15 hover:shadow-md cursor-grab active:cursor-grabbing"
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              touchAction: "none",
                            }}
                            onPointerDown={(e) =>
                              handlePointerDownSlot(e, "move", date, sIdx, slot)
                            }
                          >
                            {/* Top Resize Handle */}
                            <div
                              className="absolute top-0 inset-x-0 h-2.5 cursor-ns-resize hover:bg-primary/30 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Kéo để đổi giờ bắt đầu"
                              onPointerDown={(e) =>
                                handlePointerDownSlot(
                                  e,
                                  "resize-top",
                                  date,
                                  sIdx,
                                  slot
                                )
                              }
                            >
                              <div className="w-6 h-0.5 rounded-full bg-primary/60" />
                            </div>

                            {/* Card Content Header */}
                            <div className="p-1.5 flex items-start justify-between gap-1">
                              <div className="min-w-0 flex items-center gap-1">
                                <GripVertical className="size-3 text-primary/50 shrink-0 group-hover:text-primary transition-colors" />
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold leading-tight truncate">
                                      Nhóm {sIdx + 1}
                                    </span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 font-semibold tabular-nums">
                                      {slotDuration}p
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold tabular-nums opacity-90 block leading-tight mt-0.5">
                                    {isBeingDragged
                                      ? `${minutesToTime(startMin)} – ${minutesToTime(endMin)}`
                                      : `${slot.startTime} – ${slot.endTime}`}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons (Edit / Delete) */}
                              <div
                                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSlot({
                                      date,
                                      index: sIdx,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                    });
                                  }}
                                  className="size-5 rounded flex items-center justify-center text-primary/70 hover:bg-primary/20 hover:text-primary transition-colors"
                                  title="Chỉnh sửa giờ"
                                >
                                  <Pencil className="size-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveSlot(date, sIdx);
                                  }}
                                  className="size-5 rounded flex items-center justify-center text-primary/70 hover:bg-destructive hover:text-white transition-colors"
                                  title="Xoá slot"
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                              </div>
                            </div>

                            {/* Dragging Floating Tooltip */}
                            {isBeingDragged && (
                              <div
                                className={cn(
                                  "absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md z-40 whitespace-nowrap flex items-center gap-1",
                                  hasConflict ? "bg-destructive" : "bg-primary"
                                )}
                              >
                                {hasConflict ? (
                                  <>
                                    <AlertCircle className="size-3" /> Trùng giờ!
                                  </>
                                ) : (
                                  <>
                                    <Clock3 className="size-3" />
                                    {minutesToTime(startMin)} – {minutesToTime(endMin)} ({slotDuration}p)
                                  </>
                                )}
                              </div>
                            )}

                            {/* Bottom Resize Handle */}
                            <div
                              className="absolute bottom-0 inset-x-0 h-2.5 cursor-ns-resize hover:bg-primary/30 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Kéo để đổi giờ kết thúc"
                              onPointerDown={(e) =>
                                handlePointerDownSlot(
                                  e,
                                  "resize-bottom",
                                  date,
                                  sIdx,
                                  slot
                                )
                              }
                            >
                              <div className="w-6 h-0.5 rounded-full bg-primary/60" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Dialog / Popover */}
      {editingSlot && (
        <Dialog
          open={Boolean(editingSlot)}
          onOpenChange={(open) => !open && setEditingSlot(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader icon={Clock3} iconTone="primary">
              <DialogTitle>Chỉnh sửa khung giờ đánh giá</DialogTitle>
              <DialogDescription>
                Ngày {formatDate(editingSlot.date, "dddd, DD/MM/YYYY")} · Nhóm{" "}
                {editingSlot.index + 1}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Giờ bắt đầu
                  </label>
                  <TimeField
                    ariaLabel="Giờ bắt đầu slot"
                    value={editingSlot.startTime}
                    onChange={(time) => {
                      const dur =
                        timeToMinutes(editingSlot.endTime) -
                        timeToMinutes(editingSlot.startTime);
                      const safeDur = dur > 0 ? dur : duration || 90;
                      const nextEnd = minutesToTime(
                        timeToMinutes(time) + safeDur
                      );
                      setEditingSlot({
                        ...editingSlot,
                        startTime: time,
                        endTime: nextEnd,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Giờ kết thúc
                  </label>
                  <TimeField
                    ariaLabel="Giờ kết thúc slot"
                    value={editingSlot.endTime}
                    onChange={(time) =>
                      setEditingSlot({ ...editingSlot, endTime: time })
                    }
                  />
                </div>
              </div>

              {/* Quick duration presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Đặt nhanh thời lượng:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[45, 60, 75, 90, 105, 120, 135].map((mins) => {
                    const currentDur =
                      timeToMinutes(editingSlot.endTime) -
                      timeToMinutes(editingSlot.startTime);
                    const active = currentDur === mins;

                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          const startM = timeToMinutes(editingSlot.startTime);
                          setEditingSlot({
                            ...editingSlot,
                            endTime: minutesToTime(startM + mins),
                          });
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {mins} phút
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validation warnings */}
              {editingSlot.endTime <= editingSlot.startTime && (
                <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-4 shrink-0" />
                  Giờ kết thúc phải sau giờ bắt đầu.
                </div>
              )}

              {/* Conflict Check */}
              {(() => {
                const dayDraft = dayByDate.get(editingSlot.date);
                const otherSlots = dayDraft
                  ? dayDraft.slots.filter((_, i) => i !== editingSlot.index)
                  : [];
                const conflict = otherSlots.some((s) =>
                  slotsOverlap(s, {
                    startTime: editingSlot.startTime,
                    endTime: editingSlot.endTime,
                  })
                );

                if (conflict) {
                  return (
                    <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-4 shrink-0" />
                      Khung giờ này bị trùng lặp với một slot khác trong cùng ngày!
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemoveSlot(editingSlot.date, editingSlot.index);
                  setEditingSlot(null);
                }}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Xoá slot này
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSlot(null)}
                >
                  Huỷ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    editingSlot.endTime <= editingSlot.startTime ||
                    (dayByDate
                      .get(editingSlot.date)
                      ?.slots.filter((_, i) => i !== editingSlot.index)
                      .some((s) =>
                        slotsOverlap(s, {
                          startTime: editingSlot.startTime,
                          endTime: editingSlot.endTime,
                        })
                      ) ?? false)
                  }
                  onClick={() => {
                    if (onUpdateSlot) {
                      onUpdateSlot(editingSlot.date, editingSlot.index, {
                        startTime: editingSlot.startTime,
                        endTime: editingSlot.endTime,
                      });
                    }
                    setEditingSlot(null);
                  }}
                >
                  <Check className="mr-1.5 size-3.5" />
                  Lưu thay đổi
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer Registration Deadline Input */}
      {phase !== "range" && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/10 px-5 py-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="manual-registration-deadline-date"
                className="text-xs font-semibold text-foreground shrink-0"
              >
                Hạn đăng ký chọn lịch:
              </label>
              <DateField
                id="manual-registration-deadline-date"
                ariaLabel="Ngày hạn đăng ký chọn lịch"
                value={registrationDeadline?.date ?? ""}
                max={startDate || undefined}
                onChange={(date) =>
                  onRegistrationDeadlineChange({
                    date,
                    time: registrationDeadline?.time ?? "23:59",
                  })
                }
                className="h-9 w-40 bg-background"
                aria-describedby="manual-registration-deadline-help"
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="manual-registration-deadline-time"
                className="text-xs font-semibold text-foreground shrink-0"
              >
                Giờ hạn:
              </label>
              <TimeField
                id="manual-registration-deadline-time"
                size="default"
                ariaLabel="Giờ hạn đăng ký chọn lịch"
                value={registrationDeadline?.time ?? "23:59"}
                onChange={(time) =>
                  onRegistrationDeadlineChange({
                    date: registrationDeadline?.date ?? "",
                    time,
                  })
                }
                className="min-h-9 h-9 w-32 bg-background"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <p
              id="manual-registration-deadline-help"
              className="text-xs text-muted-foreground"
            >
              Deadline phải trước/bằng ngày bắt đầu ({startDate || "..."}).
            </p>
            {registrationDeadline &&
              startDate &&
              registrationDeadline.date > startDate && (
                <p className="text-xs font-medium text-destructive">
                  Lỗi: Hạn đăng ký phải vào hoặc trước ngày bắt đầu chấm.
                </p>
              )}
          </div>
        </div>
      )}

      {/* Range Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !open && onCancelRangeConfirm()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader icon={CalendarRange} iconTone="primary">
            <DialogTitle>Xác nhận khoảng ngày</DialogTitle>
            <DialogDescription>
              {pendingStart && pendingEnd && (
                <>
                  Đợt đánh giá diễn ra từ{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(pendingStart, "dddd, DD/MM/YYYY")}
                  </span>{" "}
                  đến{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(pendingEnd, "dddd, DD/MM/YYYY")}
                  </span>{" "}
                  ({dateRange(pendingStart, pendingEnd).length} ngày). Bạn sẽ
                  chọn hạn đăng ký và khung giờ trong khoảng này ở bước tiếp
                  theo.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelRangeConfirm}
            >
              Huỷ, chọn lại
            </Button>
            <Button type="button" onClick={onConfirmRange}>
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
