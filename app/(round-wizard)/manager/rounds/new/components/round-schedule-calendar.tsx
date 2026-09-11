"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Plus, Sparkles, Sun, Sunset, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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

const START_MINUTES = 7 * 60;
const END_MINUTES = 18 * 60;
const PIXELS_PER_MINUTE = 54 / 60;
const GRID_PADDING = 14;
const GRID_HEIGHT =
  (END_MINUTES - START_MINUTES) * PIXELS_PER_MINUTE + GRID_PADDING * 2;
const GUTTER_WIDTH = 64;
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function pixelsFromMinutes(minutes: number) {
  return GRID_PADDING + (minutes - START_MINUTES) * PIXELS_PER_MINUTE;
}

function minutesFromTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeFromMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  
  // Create full Monday->Sunday weeks until the week containing endDate is included
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
  /** false = thuộc tháng trước/sau, hiển thị mờ để lấp đầy lưới thay vì để trống. */
  inCurrentMonth: boolean;
}

function getMonthMatrix(year: number, month: number): MonthCell[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Thứ 2 = 0
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

type Phase = "range" | "deadline" | "slots";

function computePhase(
  startDate: string,
  endDate: string,
): Phase {
  if (!startDate || !endDate) return "range";
  return "slots";
}

const PHASE_BANNER: Record<
  Phase,
  { icon: typeof CalendarRange; text: string; tone: string }
> = {
  range: {
    icon: CalendarRange,
    text: "Bấm chọn ngày bắt đầu, rồi ngày kết thúc đợt — dùng nút để xem tháng khác.",
    tone: "text-primary",
  },
  deadline: {
    icon: Clock3,
    text: "Bấm một ngày trong khung để đặt hạn đăng ký chọn lịch.",
    tone: "text-amber-600 dark:text-amber-400",
  },
  slots: {
    icon: Clock3,
    text: "Bấm vào khung giờ trong lịch để thêm khung giờ đánh giá.",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
};

type Mode = "slot" | "deadline";

const LEGEND_ITEMS: {
  key: Mode;
  label: string;
  dot: string;
  badge: string;
  solid: string;
}[] = [
  {
    key: "slot",
    label: "Khung giờ đánh giá",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
    solid: "bg-primary text-primary-foreground",
  },
];

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
  onAddSlot: (date: string, startTime: string) => void;
  onRemoveSlot: (date: string, index: number) => void;
  onApplyPreset?: (dates: string[], preset: "morning" | "afternoon" | "full") => void;
  onClearSlots?: (dates?: string[]) => void;
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
  onRemoveSlot,
  onApplyPreset,
  onClearSlots,
}: RoundScheduleCalendarProps) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [previewSlot, setPreviewSlot] = useState<{
    date: string;
    minutes: number;
  } | null>(null);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [movePreview, setMovePreview] = useState<{
    date: string;
    minutes: number;
  } | null>(null);
  const [movingSource, setMovingSource] = useState<{
    sourceDate: string;
    sourceIndex: number;
  } | null>(null);
  const [hoverGridSlot, setHoverGridSlot] = useState<{
    date: string;
    minutes: number;
  } | null>(null);
  const [manualMode, setManualMode] = useState<Mode | null>(null);
  const [deadlineMovePreview, setDeadlineMovePreview] = useState<{
    date: string;
    minutes: number;
  } | null>(null);

  const phase = computePhase(startDate, endDate);
  const defaultMode: Mode = phase === "deadline" ? "deadline" : "slot";
  const activeMode: Mode = manualMode ?? defaultMode;
  const bannerPhase: Phase =
    phase === "range" ? "range" : activeMode === "deadline" ? "deadline" : "slots";
  const banner = PHASE_BANNER[bannerPhase];

  const weeksOfRange = phase !== "range" ? getWeekColumns(startDate, endDate) : [];
  const currentWeekColumns = weeksOfRange[currentWeekIndex] || [];
  const totalWeeks = weeksOfRange.length;

  const [prevRange, setPrevRange] = useState({ startDate, endDate });
  if (startDate !== prevRange.startDate || endDate !== prevRange.endDate) {
    setPrevRange({ startDate, endDate });
    setCurrentWeekIndex(0);
  }

  function handleResetRange() {
    setManualMode(null);
    onResetRange();
  }

  const dayByDate = new Map(days.map((d) => [d.date, d]));
  const today = todayKey();
  const isCurrentMonthView =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();

  function goMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function handleHeaderClickRangeCell(date: string) {
    onHeaderClickRange(date);
  }

  function dateAtClientX(clientX: number): string | null {
    const el = scrollRef.current;
    if (!el || currentWeekColumns.length === 0) return null;
    const rect = el.getBoundingClientRect();
    const contentX = clientX - rect.left + el.scrollLeft - GUTTER_WIDTH;
    if (contentX < 0) return null;
    const totalGridWidth = Math.max(el.clientWidth, 800) - GUTTER_WIDTH;
    const colWidth = totalGridWidth / currentWeekColumns.length;
    const index = Math.floor(contentX / colWidth);
    const date = currentWeekColumns[index] ?? null;
    if (date && (date < startDate || date > endDate)) return null;
    return date;
  }

  function minutesAtClientY(clientY: number): number {
    const rect = gridBodyRef.current?.getBoundingClientRect();
    const y = rect ? clientY - rect.top : 0;
    let minutes = START_MINUTES + (y - GRID_PADDING) / PIXELS_PER_MINUTE;
    minutes = Math.round(minutes / 30) * 30;
    return Math.max(START_MINUTES, Math.min(END_MINUTES - duration, minutes));
  }

  function commitGridClick(date: string, minutes: number) {
    if (activeMode === "slot" && duration > 0) {
      onAddSlot(date, timeFromMinutes(minutes));
      return;
    }
    if (activeMode === "deadline") {
      onRegistrationDeadlineChange({ date, time: timeFromMinutes(minutes) });
    }
  }

  function deadlinePositionFromEvent(
    e: MouseEvent,
    grabOffsetY: number,
    fallbackDate: string,
  ) {
    const date = dateAtClientX(e.clientX) ?? fallbackDate;
    const rect = gridBodyRef.current?.getBoundingClientRect();
    const rawY = rect ? e.clientY - grabOffsetY - rect.top : 0;
    let minutes = START_MINUTES + (rawY - GRID_PADDING) / PIXELS_PER_MINUTE;
    minutes = Math.round(minutes / 30) * 30;
    minutes = Math.max(START_MINUTES, Math.min(END_MINUTES, minutes));
    return { date, minutes };
  }

  function slotFits(
    date: string,
    startTime: string,
    excludeDate: string,
    excludeIndex: number,
  ): boolean {
    const draft = dayByDate.get(date);
    if (!draft) return true;
    const endTime = timeFromMinutes(minutesFromTime(startTime) + duration);
    return !draft.slots.some((s, i) => {
      if (date === excludeDate && i === excludeIndex) return false;
      return startTime < s.endTime && s.startTime < endTime;
    });
  }

  interface MoveInfo {
    sourceDate: string;
    sourceIndex: number;
    grabOffsetY: number;
  }

  interface DeadlineMoveInfo {
    initialDate: string;
    grabOffsetY: number;
  }

  const dragRef = useRef<{
    kind: "pan" | "create" | "move" | "move-deadline" | null;
    startX: number;
    startY: number;
    startScrollLeft: number;
    date: string | null;
    move: MoveInfo | null;
    deadline: DeadlineMoveInfo | null;
  } | null>(null);

  function handleGridMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || !scrollRef.current) return;
    e.preventDefault();
    dragRef.current = {
      kind: null,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: scrollRef.current.scrollLeft,
      date: null,
      move: null,
      deadline: null,
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  function handleSlotMouseDown(
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    date: string,
    index: number,
    startTime: string,
  ) {
    e.stopPropagation();
    if (e.button !== 0 || activeMode !== "slot" || !scrollRef.current) return;
    if (date < startDate || date > endDate) return;
    e.preventDefault();
    const startMinutes = minutesFromTime(startTime);
    const rect = gridBodyRef.current?.getBoundingClientRect();
    const slotTopClientY = rect
      ? rect.top + pixelsFromMinutes(startMinutes)
      : e.clientY;
    dragRef.current = {
      kind: "move",
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: scrollRef.current.scrollLeft,
      date: null,
      move: {
        sourceDate: date,
        sourceIndex: index,
        grabOffsetY: e.clientY - slotTopClientY,
      },
      deadline: null,
    };
    setMovePreview({ date, minutes: startMinutes });
    setMovingSource({ sourceDate: date, sourceIndex: index });
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  function handleDeadlineMouseDown(
    e: React.MouseEvent<HTMLDivElement>,
    date: string,
    time: string,
  ) {
    e.stopPropagation();
    if (e.button !== 0 || !scrollRef.current) return;
    e.preventDefault();
    const minutes = minutesFromTime(time);
    const rect = gridBodyRef.current?.getBoundingClientRect();
    const lineClientY = rect
      ? rect.top + pixelsFromMinutes(minutes)
      : e.clientY;
    dragRef.current = {
      kind: "move-deadline",
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: scrollRef.current.scrollLeft,
      date: null,
      move: null,
      deadline: {
        initialDate: date,
        grabOffsetY: e.clientY - lineClientY,
      },
    };
    setDeadlineMovePreview({ date, minutes });
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  function movePositionFromEvent(e: MouseEvent, move: MoveInfo) {
    const date = dateAtClientX(e.clientX) ?? move.sourceDate;
    const rect = gridBodyRef.current?.getBoundingClientRect();
    const rawY = rect ? e.clientY - move.grabOffsetY - rect.top : 0;
    let minutes = START_MINUTES + (rawY - GRID_PADDING) / PIXELS_PER_MINUTE;
    minutes = Math.round(minutes / 30) * 30;
    minutes = Math.max(
      START_MINUTES,
      Math.min(END_MINUTES - duration, minutes),
    );
    return { date, minutes };
  }

  function handleWindowMouseMove(e: MouseEvent) {
    const drag = dragRef.current;
    if (!drag || !scrollRef.current) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.kind === "move" && drag.move) {
      setMovePreview(movePositionFromEvent(e, drag.move));
      return;
    }

    if (drag.kind === "move-deadline" && drag.deadline) {
      const pos = deadlinePositionFromEvent(
        e,
        drag.deadline.grabOffsetY,
        drag.deadline.initialDate,
      );
      setDeadlineMovePreview(pos);
      return;
    }

    if (drag.kind === null) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        drag.kind = "pan";
        setIsPanning(true);
      } else if (activeMode === "slot" && duration > 0) {
        drag.kind = "create";
        drag.date = dateAtClientX(e.clientX);
        setIsCreatingSlot(true);
      } else {
        drag.kind = "pan";
        setIsPanning(true);
      }
    }

    if (drag.kind === "pan") {
      scrollRef.current.scrollLeft = drag.startScrollLeft - dx;
      return;
    }

    if (drag.kind === "create" && drag.date) {
      setPreviewSlot({ date: drag.date, minutes: minutesAtClientY(e.clientY) });
    }

    if (drag.kind === null && activeMode === "slot") {
      const date = dateAtClientX(e.clientX);
      if (date) {
        const minutes = minutesAtClientY(e.clientY);
        if (slotFits(date, timeFromMinutes(minutes), "", -1)) {
          setHoverGridSlot({ date, minutes });
        } else {
          setHoverGridSlot(null);
        }
      } else {
        setHoverGridSlot(null);
      }
    }
  }

  function handleWindowMouseUp(e: MouseEvent) {
    const drag = dragRef.current;
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
    dragRef.current = null;
    setIsPanning(false);
    setIsCreatingSlot(false);
    setPreviewSlot(null);
    setMovePreview(null);
    setMovingSource(null);
    setDeadlineMovePreview(null);

    if (!drag) return;

    if (drag.kind === "move-deadline" && drag.deadline) {
      const pos = deadlinePositionFromEvent(
        e,
        drag.deadline.grabOffsetY,
        drag.deadline.initialDate,
      );
      onRegistrationDeadlineChange({
        date: pos.date,
        time: timeFromMinutes(pos.minutes),
      });
      return;
    }

    if (drag.kind === "move" && drag.move) {
      const { date, minutes } = movePositionFromEvent(e, drag.move);
      const newStart = timeFromMinutes(minutes);
      const unchanged =
        date === drag.move.sourceDate &&
        newStart ===
          dayByDate.get(date)?.slots[drag.move.sourceIndex]?.startTime;
      if (
        !unchanged &&
        slotFits(date, newStart, drag.move.sourceDate, drag.move.sourceIndex)
      ) {
        onRemoveSlot(drag.move.sourceDate, drag.move.sourceIndex);
        onAddSlot(date, newStart);
      }
      return;
    }

    if (drag.kind === "create" && drag.date) {
      commitGridClick(drag.date, minutesAtClientY(e.clientY));
      return;
    }
    if (drag.kind === null) {
      const date = dateAtClientX(e.clientX);
      if (date) commitGridClick(date, minutesAtClientY(e.clientY));
    }
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewEnd = pendingEnd ?? hoverDate ?? undefined;
  const weeks = getMonthMatrix(viewYear, viewMonth);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {phase !== "range" && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          {LEGEND_ITEMS.map((item) => {
            const active = activeMode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setManualMode(item.key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? cn(item.solid, "shadow-sm")
                    : cn(item.badge, "hover:brightness-95"),
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    active ? "bg-white" : item.dot,
                  )}
                  aria-hidden
                />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2 text-sm">
          <banner.icon
            className={cn("size-4 shrink-0", banner.tone)}
            aria-hidden
          />
          <p className={cn("text-pretty", banner.tone)}>{banner.text}</p>
        </div>
        <div className="flex items-center gap-2">
          {phase === "range" && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium tabular-nums text-foreground capitalize">
                {formatDate(
                  `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`,
                  "MMMM YYYY",
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
              onClick={handleResetRange}
            >
              Đổi khoảng ngày
            </Button>
          )}
        </div>
      </div>

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
                      handleHeaderClickRangeCell(date);
                    }}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() =>
                      setHoverDate((d) => (d === date ? null : d))
                    }
                    className={cn(
                      "flex min-h-0 items-center justify-center rounded-lg transition-colors",
                      !selectable && "cursor-not-allowed",
                      selectable && "cursor-pointer hover:bg-muted",
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
                        !isPendingStart && isToday && "ring-2 ring-sky-500",
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}

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
                  ({formatDate(currentWeekColumns[0], "DD/MM")} – {formatDate(currentWeekColumns[6], "DD/MM/YYYY")})
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
            <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">Thao tác nhanh tuần này:</span>
            {onApplyPreset && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset(currentWeekColumns.filter(d => d >= startDate && d <= endDate), "morning")}
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sun className="size-3.5 text-amber-500" />
                  + Ca sáng
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset(currentWeekColumns.filter(d => d >= startDate && d <= endDate), "afternoon")}
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sunset className="size-3.5 text-orange-500" />
                  + Ca chiều
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset(currentWeekColumns.filter(d => d >= startDate && d <= endDate), "full")}
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

      {phase !== "range" && (
        <div
          ref={scrollRef}
          onMouseDown={handleGridMouseDown}
          onMouseLeave={() => setHoverGridSlot(null)}
          className={cn(
            "min-h-[500px] flex-1 overflow-auto select-none",
            isPanning || movePreview ? "cursor-grabbing" : "cursor-default",
          )}
        >
          <div className="w-full min-w-[760px]">
            <div className="sticky top-0 z-30 flex w-full border-b border-border bg-card">
              <div
                className="sticky left-0 z-40 shrink-0 border-r border-border bg-card"
                style={{ width: GUTTER_WIDTH }}
              />
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
                        "flex flex-1 min-w-0 flex-col items-center justify-center gap-1 border-r border-border px-2 py-2",
                        isToday && "bg-sky-500/5",
                        isOutOfRange && "bg-muted/30 opacity-70"
                      )}
                    >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[11px] font-medium uppercase", isOutOfRange ? "text-muted-foreground/60" : "text-muted-foreground")}>
                        {WEEKDAY_LABELS[index]}
                      </span>
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                          isDeadlineDay && "bg-amber-500 text-white shadow-xs",
                          !isDeadlineDay &&
                            isToday &&
                            "ring-1.5 ring-sky-500 text-foreground",
                          !isDeadlineDay && !isToday && (isOutOfRange ? "text-muted-foreground/60" : "text-foreground"),
                        )}
                      >
                        {formatDate(date, "DD")}
                      </span>
                    </div>
                    
                    {isOutOfRange ? (
                      <div className="flex items-center">
                        <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground/60">Ngoài đợt</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                          (draft?.slots.length ?? 0) > 0 ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                        )}>
                          {draft?.slots.length ?? 0} slot
                        </span>
                        {onApplyPreset && (
                          <Popover>
                            <PopoverTrigger
                              className="flex size-4.5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title="Thao tác nhanh cho ngày này"
                            >
                              <Plus className="size-3" />
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-48 p-1.5 text-xs">
                              <div className="space-y-1">
                                <p className="px-2 py-1 font-medium text-muted-foreground text-[11px]">
                                  {formatDate(date, "dddd, DD/MM")}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => onApplyPreset([date], "morning")}
                                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left hover:bg-muted"
                                >
                                  <Sun className="size-3 text-amber-500" />
                                  + Ca sáng (07:30 - 11:30)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onApplyPreset([date], "afternoon")}
                                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left hover:bg-muted"
                                >
                                  <Sunset className="size-3 text-orange-500" />
                                  + Ca chiều (13:00 - 17:00)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onApplyPreset([date], "full")}
                                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left hover:bg-muted"
                                >
                                  <Sparkles className="size-3 text-primary" />
                                  + Cả ngày
                                </button>
                                {(draft?.slots.length ?? 0) > 0 && onClearSlots && (
                                  <button
                                    type="button"
                                    onClick={() => onClearSlots([date])}
                                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="size-3" />
                                    Xoá các slot
                                  </button>
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

            <motion.div
              ref={gridBodyRef}
              initial={reduceMotion ? undefined : { opacity: 0, scaleY: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full"
              style={{ height: GRID_HEIGHT, transformOrigin: "top" }}
            >
              <div
                className="sticky left-0 z-20 shrink-0 border-r border-border bg-card"
                style={{ width: GUTTER_WIDTH, height: GRID_HEIGHT }}
              >
                {Array.from(
                  { length: (END_MINUTES - START_MINUTES) / 60 + 1 },
                  (_, i) => START_MINUTES + i * 60,
                ).map((minutes) => (
                  <span
                    key={minutes}
                    className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground tabular-nums"
                    style={{ top: pixelsFromMinutes(minutes) }}
                  >
                    {String(Math.floor(minutes / 60)).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              <div className="flex flex-1 min-w-0">
                {currentWeekColumns.map((date) => {
                  const draft = dayByDate.get(date);
                  const isToday = date === today;
                  const isSlotMode = activeMode === "slot";
                  const isDeadlineDay = registrationDeadline?.date === date;
                  const isOutOfRange = date < startDate || date > endDate;

                  return (
                    <div
                      key={date}
                      className={cn(
                        "relative flex-1 min-w-0 border-r border-border select-none",
                        isToday && "bg-sky-500/5",
                        isOutOfRange ? "bg-muted/20 cursor-not-allowed" : "cursor-crosshair",
                      )}
                      style={{ height: GRID_HEIGHT }}
                    >
                    {Array.from(
                      {
                        length:
                          Math.floor((END_MINUTES - START_MINUTES) / 30) + 1,
                      },
                      (_, i) => START_MINUTES + i * 30,
                    ).map((minutes) => (
                      <span
                        key={minutes}
                        className={cn(
                          "absolute inset-x-0 border-t",
                          minutes % 60 === 0
                            ? "border-border"
                            : "border-dashed border-border/60",
                        )}
                        style={{ top: pixelsFromMinutes(minutes) }}
                        aria-hidden
                      />
                    ))}

                    {isDeadlineDay &&
                      registrationDeadline &&
                      !deadlineMovePreview && (
                        <div
                          onMouseDown={
                            activeMode === "deadline"
                              ? (e) =>
                                  handleDeadlineMouseDown(
                                    e,
                                    date,
                                    registrationDeadline.time,
                                  )
                              : undefined
                          }
                          className={cn(
                            "absolute inset-x-0 z-10 flex items-center",
                            activeMode === "deadline"
                              ? "cursor-grab active:cursor-grabbing"
                              : "pointer-events-none",
                          )}
                          style={{
                            top: pixelsFromMinutes(
                              minutesFromTime(registrationDeadline.time),
                            ),
                          }}
                        >
                          <span className="h-0.5 flex-1 bg-amber-500" />
                          <span className="absolute right-1 -translate-y-1/2 rounded bg-amber-500 px-1 py-0.5 text-[10px] leading-none font-semibold text-white">
                            {registrationDeadline.time}
                          </span>
                        </div>
                      )}

                    {deadlineMovePreview?.date === date && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                        style={{
                          top: pixelsFromMinutes(deadlineMovePreview.minutes),
                        }}
                      >
                        <span className="h-0.5 flex-1 bg-amber-500" />
                        <span className="absolute right-1 -translate-y-1/2 rounded bg-amber-500 px-1 py-0.5 text-[10px] leading-none font-semibold text-white shadow-md">
                          {timeFromMinutes(deadlineMovePreview.minutes)}
                        </span>
                      </div>
                    )}

                    {isSlotMode &&
                      isCreatingSlot &&
                      previewSlot?.date === date &&
                      duration > 0 && (
                        <div
                          className="pointer-events-none absolute inset-x-1 flex items-center justify-center rounded-md border-2 border-primary bg-primary/25 text-[11px] font-medium text-primary"
                          style={{
                            top: pixelsFromMinutes(previewSlot.minutes) + 1,
                            height:
                              Math.max(18, duration * PIXELS_PER_MINUTE) - 2,
                          }}
                        >
                          {timeFromMinutes(previewSlot.minutes)}–
                          {timeFromMinutes(previewSlot.minutes + duration)}
                        </div>
                      )}

                    {hoverGridSlot?.date === date && !isCreatingSlot && !movingSource && duration > 0 && (
                      <div
                        className="pointer-events-none absolute inset-x-1.5 flex items-center justify-center rounded-lg border border-dashed border-primary bg-primary/5 text-[11px] font-semibold text-primary transition-colors"
                        style={{
                          top: pixelsFromMinutes(hoverGridSlot.minutes) + 1,
                          height: Math.max(22, duration * PIXELS_PER_MINUTE) - 2,
                        }}
                      >
                        + {timeFromMinutes(hoverGridSlot.minutes)}–{timeFromMinutes(hoverGridSlot.minutes + duration)}
                      </div>
                    )}

                    {movePreview?.date === date && movingSource && (
                      <div
                        className="pointer-events-none absolute inset-x-1.5 flex flex-col justify-center rounded-lg border-2 border-primary bg-primary/30 px-2 py-1 text-left text-primary shadow-md"
                        style={{
                          top: pixelsFromMinutes(movePreview.minutes) + 1,
                          height: Math.max(22, duration * PIXELS_PER_MINUTE) - 2,
                        }}
                      >
                        <span className="text-xs font-semibold tabular-nums leading-tight">
                          {timeFromMinutes(movePreview.minutes)}–{timeFromMinutes(movePreview.minutes + duration)}
                        </span>
                      </div>
                    )}

                    {(draft?.slots ?? []).map((slot, index) => {
                      const top = pixelsFromMinutes(
                        minutesFromTime(slot.startTime),
                      );
                      const height = Math.max(
                        22,
                        (minutesFromTime(slot.endTime) -
                          minutesFromTime(slot.startTime)) *
                          PIXELS_PER_MINUTE,
                      );
                      const isBeingMoved =
                        movingSource?.sourceDate === date &&
                        movingSource.sourceIndex === index;
                      return (
                        <div
                          key={`${slot.startTime}-${index}`}
                          onMouseDown={(e) =>
                            handleSlotMouseDown(e, date, index, slot.startTime)
                          }
                          className={cn(
                            "group absolute inset-x-1.5 flex cursor-grab flex-col justify-center rounded-lg border border-primary/40 bg-primary/15 px-2 py-1 text-left text-primary shadow-sm backdrop-blur-[1px] transition-colors hover:border-primary hover:bg-primary/25 active:cursor-grabbing",
                            isBeingMoved && "pointer-events-none opacity-0",
                          )}
                          style={{
                            top: top + 1,
                            height: height - 2,
                          }}
                          title="Kéo để đổi giờ · Bấm ✕ để xoá"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold tracking-tight tabular-nums sm:text-xs">
                              {slot.startTime}–{slot.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSlot(date, index);
                              }}
                              className="flex size-4 shrink-0 items-center justify-center rounded-md text-primary/70 opacity-0 transition-all hover:bg-destructive hover:text-white group-hover:opacity-100"
                              title="Xoá khung giờ"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {phase !== "range" && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/10 px-5 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="manual-registration-deadline-date" className="text-xs font-semibold text-foreground shrink-0">
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
              <label htmlFor="manual-registration-deadline-time" className="text-xs font-semibold text-foreground shrink-0">
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
            <p id="manual-registration-deadline-help" className="text-xs text-muted-foreground">
              Deadline phải trước/bằng ngày bắt đầu ({startDate || "..."}).
            </p>
            {registrationDeadline && startDate && registrationDeadline.date > startDate && (
              <p className="text-xs font-medium text-destructive">
                Lỗi: Hạn đăng ký phải vào hoặc trước ngày bắt đầu chấm.
              </p>
            )}
          </div>
        </div>
      )}

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
