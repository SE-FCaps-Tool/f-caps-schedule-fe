"use client";

import { useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Plus, Sparkles, Sun, Sunset, Trash2, X, Check } from "lucide-react";
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

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];


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
    text: "Bấm vào các ô slot để chọn hoặc bỏ chọn khung giờ đánh giá.",
    tone: "text-primary",
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

export interface SubGroupSlot {
  index: number;
  label: string;
  startTime: string;
  endTime: string;
}

export interface UniversitySlotDef {
  slotNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  period: "morning" | "afternoon";
  subSlots: SubGroupSlot[];
}

export const STANDARD_UNIVERSITY_SLOTS: Array<{
  slotNumber: number;
  label: string;
  startMinutes: number;
  endMinutes: number;
  period: "morning" | "afternoon";
}> = [
    { slotNumber: 1, label: "SLOT 1", startMinutes: 7 * 60, endMinutes: 9 * 60 + 15, period: "morning" },
    { slotNumber: 2, label: "SLOT 2", startMinutes: 9 * 60 + 30, endMinutes: 11 * 60 + 45, period: "morning" },
    { slotNumber: 3, label: "SLOT 3", startMinutes: 12 * 60 + 30, endMinutes: 14 * 60 + 45, period: "afternoon" },
    { slotNumber: 4, label: "SLOT 4", startMinutes: 15 * 60, endMinutes: 17 * 60 + 15, period: "afternoon" },
    { slotNumber: 5, label: "SLOT 5", startMinutes: 17 * 60 + 30, endMinutes: 19 * 60 + 45, period: "afternoon" },
  ];

export function generateUniversitySlots(groupDurationMinutes: number) {
  const dur = groupDurationMinutes > 0 ? groupDurationMinutes : 45;

  const slots: UniversitySlotDef[] = STANDARD_UNIVERSITY_SLOTS.map((slot) => {
    const subSlots: SubGroupSlot[] = [];
    let cur = slot.startMinutes;
    let idx = 1;

    while (cur + dur <= slot.endMinutes) {
      const endCur = cur + dur;
      subSlots.push({
        index: idx,
        label: `Nhóm ${idx}`,
        startTime: timeFromMinutes(cur),
        endTime: timeFromMinutes(endCur),
      });
      idx++;
      cur = endCur;
    }

    if (subSlots.length === 0) {
      subSlots.push({
        index: 1,
        label: `Nhóm 1`,
        startTime: timeFromMinutes(slot.startMinutes),
        endTime: timeFromMinutes(Math.min(slot.endMinutes, slot.startMinutes + dur)),
      });
    }

    return {
      slotNumber: slot.slotNumber,
      label: slot.label,
      startTime: timeFromMinutes(slot.startMinutes),
      endTime: timeFromMinutes(slot.endMinutes),
      period: slot.period,
      subSlots,
    };
  });

  const morningSlots = slots.filter((s) => s.period === "morning");
  const afternoonSlots = slots.filter((s) => s.period === "afternoon");

  const lunchBreak = {
    startTime: "11:45",
    endTime: "12:30",
    durationMinutes: 45,
  };

  return {
    morningSlots,
    afternoonSlots,
    allSlots: slots,
    lunchBreak,
  };
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
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<Mode | null>(null);

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
                  + Ca sáng (Slot 1, 2)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset(currentWeekColumns.filter(d => d >= startDate && d <= endDate), "afternoon")}
                  className="h-7 px-2.5 gap-1.5 text-xs bg-card"
                >
                  <Sunset className="size-3.5 text-orange-500" />
                  + Ca chiều (Slot 3, 4, 5)
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

      {phase !== "range" && (() => {
        const slotLayout = generateUniversitySlots(duration);

        return (
          <div className="min-h-[500px] flex-1 overflow-auto select-none">
            <div className="min-w-[1050px] w-full pb-16">
              <div className="sticky top-0 z-30 flex w-full border-b border-border bg-card shadow-xs">
                <div className="sticky left-0 z-40 flex items-center justify-center shrink-0 border-r border-border bg-muted/40 w-[150px] px-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Khung giờ</span>
                </div>
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
                          "flex flex-1 min-w-[125px] flex-col items-center justify-center gap-1.5 border-r border-border px-2 py-3 bg-card transition-colors relative",
                          isToday && "bg-amber-500/5",
                          isOutOfRange && "bg-muted/30 opacity-60"
                        )}
                      >
                        {isDeadlineDay && registrationDeadline && (
                          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wide",
                            isOutOfRange ? "text-muted-foreground/60" : isToday ? "text-primary font-extrabold" : "text-muted-foreground"
                          )}>
                            {WEEKDAY_LABELS[index]}
                          </span>
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-all",
                              isDeadlineDay && "bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30",
                              !isDeadlineDay && isToday && "bg-primary text-primary-foreground shadow-xs font-extrabold",
                              !isDeadlineDay && !isToday && (isOutOfRange ? "text-muted-foreground/60" : "text-foreground"),
                            )}
                          >
                            {formatDate(date, "DD")}
                          </span>
                        </div>

                        {isOutOfRange ? (
                          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60 mt-0.5">
                            Ngoài đợt
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                              (draft?.slots.length ?? 0) > 0 ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"
                            )}>
                              {draft?.slots.length ?? 0} nhóm
                            </span>
                            {onApplyPreset && (
                              <Popover>
                                <PopoverTrigger
                                  className="flex size-5 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all"
                                  title="Thao tác nhanh cho ngày này"
                                >
                                  <Plus className="size-3" />
                                </PopoverTrigger>
                                <PopoverContent align="center" className="w-52 p-2 text-xs shadow-lg">
                                  <div className="space-y-1">
                                    <p className="px-2 py-1 font-semibold text-foreground text-xs border-b border-border pb-1.5 mb-1">
                                      {formatDate(date, "dddd, DD/MM/YYYY")}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => onApplyPreset([date], "morning")}
                                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                    >
                                      <Sun className="size-3.5 text-amber-500" />
                                      + Ca sáng (Slot 1, 2)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onApplyPreset([date], "afternoon")}
                                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                    >
                                      <Sunset className="size-3.5 text-orange-500" />
                                      + Ca chiều (Slot 3, 4, 5)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onApplyPreset([date], "full")}
                                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                                    >
                                      <Sparkles className="size-3.5 text-primary" />
                                      + Cả ngày
                                    </button>
                                    {(draft?.slots.length ?? 0) > 0 && onClearSlots && (
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

              <div className="flex flex-col w-full relative">
                {/* Morning Header */}
                {slotLayout.morningSlots.length > 0 && (
                  <div className="flex w-full border-b border-border bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-amber-50 dark:bg-amber-950/40 w-[150px] px-3 py-2 flex items-center gap-2 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <Sun className="size-4 text-amber-600 dark:text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Ca sáng</span>
                    </div>
                    <div className="flex-1" />
                  </div>
                )}

                {/* Morning Slots */}
                {slotLayout.morningSlots.map((slotDef) => (
                  <div key={`morning-${slotDef.slotNumber}`} className="flex w-full border-b border-border hover:bg-muted/10 transition-colors">
                    <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-card w-[150px] p-3 flex flex-col justify-center gap-0.5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{slotDef.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          {slotDef.subSlots.length} nhóm
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {slotDef.startTime} – {slotDef.endTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground/75">
                        {duration} phút / nhóm
                      </span>
                    </div>
                    <div className="flex flex-1 min-w-0">
                      {currentWeekColumns.map((date) => {
                        const isOutOfRange = date < startDate || date > endDate;
                        const draft = dayByDate.get(date);

                        if (isOutOfRange) {
                          return (
                            <div key={`${date}-${slotDef.slotNumber}`} className="flex-1 min-w-[125px] border-r border-border p-1.5">
                              <div className="w-full h-full min-h-[72px] rounded-lg bg-muted/20 border border-dashed border-border/40 flex items-center justify-center opacity-40">
                                <span className="text-[10px] text-muted-foreground/60">Ngoài đợt</span>
                              </div>
                            </div>
                          );
                        }

                        const selectedSubSlots = slotDef.subSlots.filter(sub =>
                          draft?.slots.some(s => s.startTime === sub.startTime)
                        );
                        const allSelected = selectedSubSlots.length === slotDef.subSlots.length;

                        return (
                          <div key={`${date}-${slotDef.slotNumber}`} className="flex-1 min-w-[125px] border-r border-border p-1.5 flex flex-col gap-1.5 justify-center">
                            {slotDef.subSlots.length > 1 && (
                              <div className="flex items-center justify-between px-0.5 text-[10px] text-muted-foreground">
                                <span className="font-semibold text-[10px] text-muted-foreground">
                                  {selectedSubSlots.length}/{slotDef.subSlots.length} nhóm
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (allSelected) {
                                      slotDef.subSlots.forEach(sub => {
                                        const idx = draft?.slots.findIndex(s => s.startTime === sub.startTime) ?? -1;
                                        if (idx >= 0) onRemoveSlot(date, idx);
                                      });
                                    } else {
                                      slotDef.subSlots.forEach(sub => {
                                        const exists = draft?.slots.some(s => s.startTime === sub.startTime);
                                        if (!exists) onAddSlot(date, sub.startTime);
                                      });
                                    }
                                  }}
                                  className="text-[10px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                                >
                                  {allSelected ? "Bỏ cả slot" : "Chọn cả slot"}
                                </button>
                              </div>
                            )}

                            <div className="flex flex-col gap-1 w-full">
                              {slotDef.subSlots.map((sub) => {
                                const isSelected = draft?.slots.some(s => s.startTime === sub.startTime);
                                return isSelected ? (
                                  <button
                                    key={sub.startTime}
                                    type="button"
                                    onClick={() => {
                                      const index = draft!.slots.findIndex(s => s.startTime === sub.startTime);
                                      if (index >= 0) onRemoveSlot(date, index);
                                    }}
                                    className="w-full px-2 py-1 rounded-md border-2 border-primary bg-primary/10 text-primary flex items-center justify-between hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all group shadow-2xs text-left"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-bold leading-tight flex items-center gap-1">
                                        {sub.label}
                                      </span>
                                      <span className="text-[10px] tabular-nums font-semibold opacity-85 leading-tight group-hover:line-through">
                                        {sub.startTime} – {sub.endTime}
                                      </span>
                                    </div>
                                    <span className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-destructive group-hover:text-white transition-colors shrink-0 ml-1">
                                      <Check className="size-2.5 group-hover:hidden" />
                                      <X className="size-2.5 hidden group-hover:block" />
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    key={sub.startTime}
                                    type="button"
                                    onClick={() => onAddSlot(date, sub.startTime)}
                                    className="w-full px-2 py-1 rounded-md border border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground/70 hover:text-primary flex items-center justify-between transition-all group text-left"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-medium text-foreground/80 group-hover:text-primary leading-tight">
                                        {sub.label}
                                      </span>
                                      <span className="text-[10px] tabular-nums text-muted-foreground group-hover:text-primary/80 leading-tight">
                                        {sub.startTime} – {sub.endTime}
                                      </span>
                                    </div>
                                    <Plus className="size-3 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Lunch Break */}
                {slotLayout.lunchBreak && (
                  <div className="flex w-full border-b border-border bg-muted/20">
                    <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-muted/30 w-[150px] px-3 py-2.5 flex items-center justify-center shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <Clock3 className="size-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-1 items-center justify-center py-2.5 opacity-80"
                      style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}
                    >
                      <div className="bg-background/90 px-3 py-1 rounded-full border border-border/50 shadow-xs text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 backdrop-blur-sm">
                        <span>🍽️</span> Nghỉ trưa · {slotLayout.lunchBreak.durationMinutes} phút ({slotLayout.lunchBreak.startTime} — {slotLayout.lunchBreak.endTime})
                      </div>
                    </div>
                  </div>
                )}

                {/* Afternoon Header */}
                {slotLayout.afternoonSlots.length > 0 && (
                  <div className="flex w-full border-b border-border bg-orange-50/50 dark:bg-orange-950/20">
                    <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-orange-50 dark:bg-orange-950/40 w-[150px] px-3 py-2 flex items-center gap-2 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <Sunset className="size-4 text-orange-600 dark:text-orange-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400">Ca chiều</span>
                    </div>
                    <div className="flex-1" />
                  </div>
                )}

                {/* Afternoon Slots */}
                {slotLayout.afternoonSlots.map((slotDef) => (
                  <div key={`afternoon-${slotDef.slotNumber}`} className="flex w-full border-b border-border hover:bg-muted/10 transition-colors">
                    <div className="sticky left-0 z-20 shrink-0 border-r border-border bg-card w-[150px] p-3 flex flex-col justify-center gap-0.5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{slotDef.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          {slotDef.subSlots.length} nhóm
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {slotDef.startTime} – {slotDef.endTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground/75">
                        {duration} phút / nhóm
                      </span>
                    </div>
                    <div className="flex flex-1 min-w-0">
                      {currentWeekColumns.map((date) => {
                        const isOutOfRange = date < startDate || date > endDate;
                        const draft = dayByDate.get(date);

                        if (isOutOfRange) {
                          return (
                            <div key={`${date}-${slotDef.slotNumber}`} className="flex-1 min-w-[125px] border-r border-border p-1.5">
                              <div className="w-full h-full min-h-[72px] rounded-lg bg-muted/20 border border-dashed border-border/40 flex items-center justify-center opacity-40">
                                <span className="text-[10px] text-muted-foreground/60">Ngoài đợt</span>
                              </div>
                            </div>
                          );
                        }

                        const selectedSubSlots = slotDef.subSlots.filter(sub =>
                          draft?.slots.some(s => s.startTime === sub.startTime)
                        );
                        const allSelected = selectedSubSlots.length === slotDef.subSlots.length;

                        return (
                          <div key={`${date}-${slotDef.slotNumber}`} className="flex-1 min-w-[125px] border-r border-border p-1.5 flex flex-col gap-1.5 justify-center">
                            {slotDef.subSlots.length > 1 && (
                              <div className="flex items-center justify-between px-0.5 text-[10px] text-muted-foreground">
                                <span className="font-semibold text-[10px] text-muted-foreground">
                                  {selectedSubSlots.length}/{slotDef.subSlots.length} nhóm
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (allSelected) {
                                      slotDef.subSlots.forEach(sub => {
                                        const idx = draft?.slots.findIndex(s => s.startTime === sub.startTime) ?? -1;
                                        if (idx >= 0) onRemoveSlot(date, idx);
                                      });
                                    } else {
                                      slotDef.subSlots.forEach(sub => {
                                        const exists = draft?.slots.some(s => s.startTime === sub.startTime);
                                        if (!exists) onAddSlot(date, sub.startTime);
                                      });
                                    }
                                  }}
                                  className="text-[10px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                                >
                                  {allSelected ? "Bỏ cả slot" : "Chọn cả slot"}
                                </button>
                              </div>
                            )}

                            <div className="flex flex-col gap-1 w-full">
                              {slotDef.subSlots.map((sub) => {
                                const isSelected = draft?.slots.some(s => s.startTime === sub.startTime);
                                return isSelected ? (
                                  <button
                                    key={sub.startTime}
                                    type="button"
                                    onClick={() => {
                                      const index = draft!.slots.findIndex(s => s.startTime === sub.startTime);
                                      if (index >= 0) onRemoveSlot(date, index);
                                    }}
                                    className="w-full px-2 py-1 rounded-md border-2 border-primary bg-primary/10 text-primary flex items-center justify-between hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all group shadow-2xs text-left"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-bold leading-tight flex items-center gap-1">
                                        {sub.label}
                                      </span>
                                      <span className="text-[10px] tabular-nums font-semibold opacity-85 leading-tight group-hover:line-through">
                                        {sub.startTime} – {sub.endTime}
                                      </span>
                                    </div>
                                    <span className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-destructive group-hover:text-white transition-colors shrink-0 ml-1">
                                      <Check className="size-2.5 group-hover:hidden" />
                                      <X className="size-2.5 hidden group-hover:block" />
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    key={sub.startTime}
                                    type="button"
                                    onClick={() => onAddSlot(date, sub.startTime)}
                                    className="w-full px-2 py-1 rounded-md border border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground/70 hover:text-primary flex items-center justify-between transition-all group text-left"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-medium text-foreground/80 group-hover:text-primary leading-tight">
                                        {sub.label}
                                      </span>
                                      <span className="text-[10px] tabular-nums text-muted-foreground group-hover:text-primary/80 leading-tight">
                                        {sub.startTime} – {sub.endTime}
                                      </span>
                                    </div>
                                    <Plus className="size-3 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0 ml-1" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        );
      })()}

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
