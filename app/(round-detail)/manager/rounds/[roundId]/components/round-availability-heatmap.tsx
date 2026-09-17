"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Table2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { DateField } from "@/components/shared/date-field";
import { TimeField } from "@/components/shared/time-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatInVietnamTime } from "@/lib/utils/formatDate";
import { useRoundMyAvailability, useRoundInvitations, useUpdateRound } from "@/hooks/manager/useRounds";
import { useAllGroups } from "@/hooks/manager/useGroups";
import type { RoundDetail, RoundTimeslot } from "@/lib/api/services/fetchRounds";
import { ErrorBlock, ROW_REVEAL_CLASS, rowRevealStyle } from "./round-detail-shared";

/** Cập nhật mỗi phút — đủ để hàng "giờ hiện tại" nhích theo, không cần tick giây. */
function useNowInVietnamTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return { date: formatInVietnamTime(now, "YYYY-MM-DD"), time: formatInVietnamTime(now, "HH:mm") };
}

/** Serialize a Vietnam-local date/time without letting the browser shift the calendar day. */
function buildDeadlineIso(date: string, time: string) {
  return `${date}T${time}:00+07:00`;
}

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekKey(date: string) {
  const monday = parseDateOnly(date);
  const dayIndex = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayIndex);
  return [monday.getFullYear(), monday.getMonth() + 1, monday.getDate()].join("-");
}

/** Một dòng người/nhóm trong ô timeslot, compact để đọc như bảng thay vì card lịch. */
function RegistrationPersonRow({
  code,
  subtitle,
  tone,
  index = 0,
}: {
  code: string;
  subtitle?: string;
  tone: "orange" | "violet";
  index?: number;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-md px-1.5 py-1 transition-colors",
        tone === "orange" ? "hover:bg-orange-500/10" : "hover:bg-violet-500/10",
        ROW_REVEAL_CLASS
      )}
      style={rowRevealStyle(index)}
    >
      <span
        className={cn("mt-1 size-1.5 shrink-0 rounded-full", tone === "orange" ? "bg-orange-500" : "bg-violet-500")}
        aria-hidden
      />
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-xs font-semibold",
            tone === "orange" ? "text-orange-700 dark:text-orange-400" : "text-violet-700 dark:text-violet-400"
          )}
        >
          {code}
        </span>
        {subtitle && <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>}
      </span>
    </div>
  );
}

const CELL_PREVIEW_LIMIT = 2;
type AvailabilityView = "calendar" | "table";

function RegistrationCellSection({
  tone,
  title,
  ids,
  renderCard,
  preview = false,
}: {
  tone: "orange" | "violet";
  title: string;
  ids: number[];
  renderCard: (id: number, index: number) => ReactNode;
  preview?: boolean;
}) {
  if (ids.length === 0) return null;
  const visible = preview ? ids.slice(0, CELL_PREVIEW_LIMIT) : ids;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold",
            tone === "orange" ? "text-orange-700 dark:text-orange-400" : "text-violet-700 dark:text-violet-400"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            tone === "orange"
              ? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
              : "bg-violet-500/10 text-violet-700 dark:text-violet-400"
          )}
        >
          {ids.length}
        </span>
      </div>
      {visible.map((id, index) => renderCard(id, index))}
    </div>
  );
}

function TimeslotRegistrationCell({
  lecturerIds,
  groupIds,
  lecturerById,
  groupCodeById,
  dateLabel,
  timeLabel,
  isToday,
  isNowRow,
}: {
  lecturerIds: number[];
  groupIds: number[];
  lecturerById: Map<number, { code: string; fullName: string }>;
  groupCodeById: Map<number, string>;
  dateLabel: string;
  timeLabel: string;
  isToday: boolean;
  isNowRow: boolean;
}) {
  const total = lecturerIds.length + groupIds.length;
  const overflowCount =
    Math.max(0, lecturerIds.length - CELL_PREVIEW_LIMIT) + Math.max(0, groupIds.length - CELL_PREVIEW_LIMIT);

  if (total === 0) {
    return (
      <td className={cn("h-24 min-w-44 border-b border-l border-border p-3 align-top", isToday && "bg-primary/5")}>
        <span className="text-xs text-muted-foreground/70">Chưa có ai</span>
      </td>
    );
  }

  const renderLecturer = (id: number, index: number) => (
    <RegistrationPersonRow
      key={id}
      tone="orange"
      code={lecturerById.get(id)?.code ?? `GV${id}`}
      subtitle={lecturerById.get(id)?.fullName}
      index={index}
    />
  );
  const renderGroup = (id: number, index: number) => (
    <RegistrationPersonRow key={id} tone="violet" code={groupCodeById.get(id) ?? `#${id}`} index={index} />
  );

  return (
    <td
      className={cn(
        "h-24 min-w-48 border-b border-l border-border bg-background p-2 align-top transition-colors",
        isToday && "bg-primary/5",
        isNowRow && "shadow-[inset_0_2px_0_var(--primary)]",
        "hover:bg-muted/40"
      )}
    >
      <div className="flex min-h-20 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tabular-nums">{total} đăng ký</span>
          {overflowCount > 0 && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
                    aria-label={`Xem đầy đủ đăng ký ${dateLabel} ${timeLabel}`}
                  >
                    +{overflowCount}
                  </button>
                }
              />
              <PopoverContent side="right" align="start" className="w-80">
                <div>
                  <p className="text-sm font-semibold">
                    {dateLabel} · {timeLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{total} đăng ký trong timeslot này</p>
                </div>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  <RegistrationCellSection tone="orange" title="Giảng viên" ids={lecturerIds} renderCard={renderLecturer} />
                  <RegistrationCellSection tone="violet" title="Nhóm" ids={groupIds} renderCard={renderGroup} />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <RegistrationCellSection tone="orange" title="Giảng viên" ids={lecturerIds} renderCard={renderLecturer} preview />
        <RegistrationCellSection tone="violet" title="Nhóm" ids={groupIds} renderCard={renderGroup} preview />
      </div>
    </td>
  );
}

/**
 * Cột giữa (giai đoạn chưa có phương án ACTIVE/PUBLISHED) — bảng đăng ký theo timeslot × thứ/ngày.
 * Mỗi ô trả lời trực tiếp "khung giờ này ai đăng ký", còn ô không phải timeslot thật của round
 * hiện xám và không tương tác.
 */
export function RoundAvailabilityHeatmap({
  roundId,
  round,
}: {
  roundId: string;
  round: RoundDetail;
}) {
  const reduceMotion = useReducedMotion();
  const { date: nowDate, time: nowTime } = useNowInVietnamTime();
  const legacyRoundId = Number(roundId);
  const { data: availability, isLoading, isError } = useRoundMyAvailability(legacyRoundId);
  const { data: invitations } = useRoundInvitations(roundId);
  const { data: groups } = useAllGroups(round.semesterId);
  const updateRound = useUpdateRound();

  const canEditDeadline = round.status === "DRAFT" || round.status === "OPEN_REGISTRATION";

  /** Chỉ hiện những ngày thật sự có timeslot, tránh trải full tuần khi không cần. */
  const dates = useMemo(() => {
    const configuredDates = Array.from(
      new Set(round.days.filter((day) => day.slots.length > 0).map((day) => day.date))
    ).sort();
    if (configuredDates.length > 0) return configuredDates;

    return Array.from(
      new Set((availability?.timeslots ?? []).map((slot) => formatInVietnamTime(slot.startAt, "YYYY-MM-DD")))
    ).sort();
  }, [round.days, availability]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [viewMode, setViewMode] = useState<AvailabilityView>("table");
  const weekGroups = useMemo(() => {
    const groups: string[][] = [];
    let currentWeekKey: string | null = null;

    for (const date of dates) {
      const weekKey = getWeekKey(date);
      if (weekKey !== currentWeekKey) {
        groups.push([]);
        currentWeekKey = weekKey;
      }
      groups.at(-1)?.push(date);
    }

    return groups;
  }, [dates]);

  const activeWeekIndex = Math.min(currentWeekIndex, Math.max(weekGroups.length - 1, 0));
  const visibleDates = useMemo(() => weekGroups[activeWeekIndex] ?? [], [activeWeekIndex, weekGroups]);

  /** Lấy đúng các hàng slot đã cấu hình, giống lưới Calendar chính của Round Detail. */
  const timeRows = useMemo(() => {
    const rows = new Map<string, { start: string; end: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) {
        rows.set(slot.startTime, { start: slot.startTime, end: slot.endTime });
      }
    }
    if (rows.size === 0) {
      for (const slot of availability?.timeslots ?? []) {
        const start = formatInVietnamTime(slot.startAt, "HH:mm");
        const end = formatInVietnamTime(slot.endAt, "HH:mm");
        rows.set(start, { start, end });
      }
    }
    return Array.from(rows.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [round.days, availability]);

  const roundSlotByCell = useMemo(() => {
    const map = new Map<string, { startTime: string; endTime: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) {
        map.set(`${day.date}__${slot.startTime}`, slot);
      }
    }
    return map;
  }, [round.days]);

  /** date+giờ bắt đầu theo múi giờ Việt Nam -> timeslot thật. */
  const timeslotByCell = useMemo(() => {
    const map = new Map<string, RoundTimeslot>();
    for (const slot of availability?.timeslots ?? []) {
      const date = formatInVietnamTime(slot.startAt, "YYYY-MM-DD");
      const startTime = formatInVietnamTime(slot.startAt, "HH:mm");
      map.set(`${date}__${startTime}`, slot);
    }
    return map;
  }, [availability]);

  const lecturerAvailableByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selectedByLecturer ?? []) {
      if (row.state !== "AVAILABLE") continue;
      if (!map.has(row.timeslotId)) map.set(row.timeslotId, new Set());
      map.get(row.timeslotId)!.add(row.lecturerId);
    }
    return map;
  }, [availability]);

  const groupSelectedByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selectedByGroup ?? []) {
      if (!row.selected) continue;
      if (!map.has(row.timeslotId)) map.set(row.timeslotId, new Set());
      map.get(row.timeslotId)!.add(row.groupId);
    }
    return map;
  }, [availability]);

  /** lecturer_id (số, theo selected_by_lecturer) -> mã/tên hiển thị trên thẻ. */
  const lecturerById = useMemo(() => {
    const map = new Map<number, { code: string; fullName: string }>();
    for (const inv of invitations ?? []) {
      map.set(Number(inv.lecturer.id), { code: inv.lecturer.code, fullName: inv.lecturer.fullName });
    }
    return map;
  }, [invitations]);

  /** group_id (số, theo selected_by_group) -> mã nhóm hiển thị trên thẻ. */
  const groupCodeById = useMemo(() => {
    const map = new Map<number, string>();
    for (const group of groups ?? []) {
      const numericId = Number(group.id);
      if (Number.isFinite(numericId)) map.set(numericId, group.code);

      const prefixedNumericId = group.id.startsWith("grp_") ? Number(group.id.slice(4)) : NaN;
      if (Number.isFinite(prefixedNumericId)) map.set(prefixedNumericId, group.code);
    }
    return map;
  }, [groups]);

  const tableRows = useMemo(() => {
    return visibleDates.flatMap((date) =>
      timeRows.flatMap((row) => {
        const cellKey = `${date}__${row.start}`;
        const roundSlot = roundSlotByCell.get(cellKey);
        if (!roundSlot) return [];

        const timeslot = timeslotByCell.get(cellKey);
        return [
          {
            date,
            row,
            hasData: Boolean(timeslot),
            lecturerIds: timeslot ? Array.from(lecturerAvailableByTimeslot.get(timeslot.id) ?? []) : [],
            groupIds: timeslot ? Array.from(groupSelectedByTimeslot.get(timeslot.id) ?? []) : [],
          },
        ];
      })
    );
  }, [groupSelectedByTimeslot, lecturerAvailableByTimeslot, roundSlotByCell, timeRows, timeslotByCell, visibleDates]);

  const deadlineDate = round.registrationDeadline ? formatInVietnamTime(round.registrationDeadline, "YYYY-MM-DD") : null;
  const deadlineTime = round.registrationDeadline ? formatInVietnamTime(round.registrationDeadline, "HH:mm") : "23:59";
  const [deadlineDraftDate, setDeadlineDraftDate] = useState(() => deadlineDate ?? "");
  const [deadlineDraftTime, setDeadlineDraftTime] = useState(() => deadlineTime);

  function updateDeadline(date: string, time: string) {
    if (!canEditDeadline || updateRound.isPending || !date || date > round.startDate) return;
    updateRound.mutate({ roundId, payload: { registrationDeadline: buildDeadlineIso(date, time) } });
  }

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-104 flex-col"
    >
      {canEditDeadline && (
        <div className="flex shrink-0 flex-wrap items-end gap-4 border-b border-border pb-4">
          <div className="space-y-1.5">
            <label htmlFor="detail-registration-deadline-date" className="text-xs font-medium text-foreground">
              Hạn đăng ký chọn lịch
            </label>
            <DateField
              id="detail-registration-deadline-date"
              ariaLabel="Hạn đăng ký chọn lịch"
              value={deadlineDraftDate}
              max={round.startDate || undefined}
              disabled={updateRound.isPending}
              onChange={(date) => {
                setDeadlineDraftDate(date);
                updateDeadline(date, deadlineDraftTime);
              }}
              aria-describedby="detail-registration-deadline-help"
              className="h-11 w-44"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="detail-registration-deadline-time" className="text-xs font-medium text-foreground">
              Giờ hạn đăng ký
            </label>
            <TimeField
              id="detail-registration-deadline-time"
              ariaLabel="Giờ hạn đăng ký"
              value={deadlineDraftTime}
              disabled={updateRound.isPending}
              onChange={(time) => {
                setDeadlineDraftTime(time);
                updateDeadline(deadlineDraftDate, time);
              }}
              className="h-11 w-36"
            />
          </div>
          <p id="detail-registration-deadline-help" className="pb-1 text-xs text-muted-foreground">
            Ngày phải vào hoặc trước ngày bắt đầu chấm ({round.startDate}).
          </p>
          {deadlineDraftDate && deadlineDraftDate > round.startDate && (
            <p className="basis-full text-xs text-destructive">
              Hạn đăng ký không được sau ngày bắt đầu chấm.
            </p>
          )}
        </div>
      )}

      <div className={cn("flex min-h-0 flex-1 flex-col", canEditDeadline && "pt-4")}>
        {isLoading && <Skeleton className="h-56 w-full" />}
        {isError && <ErrorBlock label="Không tải được lịch rảnh." />}

        {availability && dates.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Round chưa có khung giờ nào.</p>
        )}

        {availability && dates.length > 0 && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Lịch đăng ký</p>
                <p className="text-xs text-muted-foreground">
                  Tuần {activeWeekIndex + 1}/{weekGroups.length}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background p-0.5">
                <button
                  type="button"
                  aria-label="Xem tuần trước"
                  disabled={activeWeekIndex <= 0}
                  onClick={() => setCurrentWeekIndex((index) => Math.max(0, index - 1))}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="min-w-36 px-2 text-center text-xs font-medium tabular-nums text-foreground">
                  {visibleDates.length > 0
                    ? `${formatDate(visibleDates[0], "DD/MM")} – ${formatDate(
                        visibleDates[visibleDates.length - 1],
                        "DD/MM/YYYY"
                      )}`
                    : "Chưa có ngày"}
                </span>
                <button
                  type="button"
                  aria-label="Xem tuần sau"
                  disabled={activeWeekIndex >= weekGroups.length - 1}
                  onClick={() => setCurrentWeekIndex((index) => Math.min(weekGroups.length - 1, index + 1))}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
              <div
                className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5"
                aria-label="Kiểu hiển thị lịch đăng ký"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "calendar"}
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                    viewMode === "calendar"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarDays className="size-3.5" aria-hidden />
                  Lưới
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                    viewMode === "table"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Table2 className="size-3.5" aria-hidden />
                  Bảng
                </button>
              </div>
            </div>
            {viewMode === "calendar" ? (
              <div className="flex-1 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 w-28 min-w-28 border-r border-b border-border bg-muted px-3 py-3 text-left align-middle text-xs font-semibold text-muted-foreground">
                    Timeslot
                  </th>
                  {visibleDates.map((date) => {
                    const isDeadline = date === deadlineDate;
                    const isToday = date === nowDate;
                    return (
                      <th
                        key={date}
                        className="sticky top-0 z-20 min-w-48 border-b border-l border-border bg-muted px-3 py-2 text-left align-middle"
                      >
                        <span className="block text-[11px] font-medium text-muted-foreground capitalize">
                          {formatDate(date, "dddd")}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-7 min-w-14 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums transition-shadow",
                              isDeadline ? "bg-amber-500 text-white" : "text-foreground",
                              !isDeadline && isToday && "ring-2 ring-primary/50"
                            )}
                          >
                            {formatDate(date, "DD/MM")}
                          </span>
                          {isDeadline && <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Hạn đăng ký</span>}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeRows.map((row) => {
                  const isNowRow = nowTime >= row.start && nowTime < row.end;
                  return (
                    <tr key={row.start}>
                      <th
                        scope="row"
                        className={cn(
                          "sticky left-0 z-10 w-28 min-w-28 border-r border-b border-border bg-background px-3 py-3 text-left align-top transition-colors",
                          isNowRow && "text-primary shadow-[inset_0_2px_0_var(--primary)]"
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                          {isNowRow && (
                            <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
                          )}
                          {row.start}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground tabular-nums">
                          đến {row.end}
                        </span>
                      </th>
                      {visibleDates.map((date) => {
                        const cellKey = `${date}__${row.start}`;
                        const roundSlot = roundSlotByCell.get(cellKey);
                        const timeslot = timeslotByCell.get(cellKey);
                        const isToday = date === nowDate;
                        const currentRowClass = isNowRow ? "shadow-[inset_0_2px_0_var(--primary)]" : "";

                        if (!roundSlot) {
                          return (
                            <td
                              key={`${date}-${row.start}`}
                              aria-disabled
                              className={cn(
                                "h-24 min-w-48 border-b border-l border-border bg-primary/5 p-3 align-top",
                                currentRowClass
                              )}
                            >
                              <span className="text-xs text-muted-foreground">Không mở</span>
                            </td>
                          );
                        }

                        if (!timeslot) {
                          return (
                            <td
                              key={`${date}-${row.start}`}
                              className={cn(
                                "h-24 min-w-48 border-b border-l border-border bg-background p-3 align-top",
                                isToday && "bg-primary/5",
                                currentRowClass
                              )}
                              title={`Khung giờ ${roundSlot.startTime} – ${roundSlot.endTime}`}
                            >
                              <span className="text-xs text-muted-foreground/70">Chưa có dữ liệu</span>
                            </td>
                          );
                        }

                        const lecturerIds = Array.from(lecturerAvailableByTimeslot.get(timeslot.id) ?? []);
                        const groupIds = Array.from(groupSelectedByTimeslot.get(timeslot.id) ?? []);

                        return (
                          <TimeslotRegistrationCell
                            key={`${date}-${row.start}`}
                            lecturerIds={lecturerIds}
                            groupIds={groupIds}
                            lecturerById={lecturerById}
                            groupCodeById={groupCodeById}
                            dateLabel={formatDate(date, "dddd, DD/MM")}
                            timeLabel={`${roundSlot.startTime} – ${roundSlot.endTime}`}
                            isToday={isToday}
                            isNowRow={isNowRow}
                          />
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            ) : (
              <div className="flex-1 overflow-auto rounded-lg border border-border">
                <table className="min-w-[920px] w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-30 min-w-36 border-b border-r border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Ngày / thứ
                      </th>
                      <th className="sticky top-0 z-20 min-w-36 border-b border-l border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Timeslot
                      </th>
                      <th className="sticky top-0 z-20 min-w-64 border-b border-l border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Giảng viên đăng ký
                      </th>
                      <th className="sticky top-0 z-20 min-w-52 border-b border-l border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Nhóm đăng ký
                      </th>
                      <th className="sticky top-0 z-20 min-w-28 border-b border-l border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Tổng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(({ date, row, hasData, lecturerIds, groupIds }, rowIndex) => {
                      const total = lecturerIds.length + groupIds.length;
                      const isToday = date === nowDate;
                      const isNowRow = nowTime >= row.start && nowTime < row.end;
                      const isFirstDateRow = rowIndex === 0 || tableRows[rowIndex - 1]?.date !== date;
                      const dateRowSpan = isFirstDateRow
                        ? tableRows.filter((tableRow) => tableRow.date === date).length
                        : undefined;

                      return (
                        <tr
                          key={`${date}-${row.start}`}
                          className={cn(
                            "border-b border-border last:border-b-0",
                            isToday && "bg-primary/[0.025]",
                            isNowRow && "shadow-[inset_0_2px_0_var(--primary)]"
                          )}
                        >
                          {isFirstDateRow && (
                            <td
                              rowSpan={dateRowSpan}
                              className={cn(
                                "sticky top-11 left-0 z-10 whitespace-nowrap border-r border-border bg-background px-3 py-3 text-center align-middle tabular-nums",
                                isToday && "bg-primary/[0.025]"
                              )}
                              style={{ verticalAlign: "middle" }}
                            >
                              <span className="flex flex-col items-center justify-center">
                                <span className="font-semibold">{formatDate(date, "DD/MM/YYYY")}</span>
                                <span className="text-xs font-normal capitalize text-muted-foreground">
                                  {formatDate(date, "dddd")}
                                </span>
                              </span>
                            </td>
                          )}
                          <td className="whitespace-nowrap border-l border-border px-3 py-3 align-top tabular-nums">
                            <span className="font-semibold">{row.start}</span>
                            <span className="block text-xs text-muted-foreground">đến {row.end}</span>
                          </td>
                          <td className="border-l border-border px-3 py-2 align-top">
                            {hasData && lecturerIds.length > 0 ? (
                              <div className="space-y-1">
                                {lecturerIds.map((id) => (
                                  <RegistrationPersonRow
                                    key={id}
                                    tone="orange"
                                    code={lecturerById.get(id)?.code ?? `GV${id}`}
                                    subtitle={lecturerById.get(id)?.fullName}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">{hasData ? "Chưa có ai" : "Chưa có dữ liệu"}</span>
                            )}
                          </td>
                          <td className="border-l border-border px-3 py-2 align-top">
                            {hasData && groupIds.length > 0 ? (
                              <div className="space-y-1">
                                {groupIds.map((id) => (
                                  <RegistrationPersonRow
                                    key={id}
                                    tone="violet"
                                    code={groupCodeById.get(id) ?? `#${id}`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">{hasData ? "Chưa có nhóm" : "Chưa có dữ liệu"}</span>
                            )}
                          </td>
                          <td className="border-l border-border px-3 py-3 align-top">
                            <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                              {hasData ? total : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {tableRows.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">Tuần này chưa có timeslot nào.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
