"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/shared/date-field";
import { TimeField } from "@/components/shared/time-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatInVietnamTime } from "@/lib/utils/formatDate";
import { useRoundMyAvailability, useRoundInvitations, useUpdateRound } from "@/hooks/manager/useRounds";
import { useGroups } from "@/hooks/manager/useGroups";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import type { RoundDetail, RoundTimeslot } from "@/lib/api/services/fetchRounds";
import type { SchedulingReadiness } from "@/lib/api/services/fetchScheduling";
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

/** Tạo date key theo lịch địa phương, tránh lệch ngày khi qua UTC. */
function addDaysStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Thẻ full-width cho 1 giảng viên/nhóm — dùng trong popover chi tiết của {@link TimeslotCell}. */
function PersonCard({
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
        "w-full rounded-md border px-2 py-1.5 transition-transform",
        tone === "orange" ? "border-orange-500/30 bg-orange-500/10" : "border-violet-500/30 bg-violet-500/10",
        ROW_REVEAL_CLASS
      )}
      style={rowRevealStyle(index)}
    >
      <p className={cn("truncate text-xs font-semibold", tone === "orange" ? "text-orange-700 dark:text-orange-400" : "text-violet-700 dark:text-violet-400")}>
        {code}
      </p>
      {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/** Ngưỡng hiện card trực tiếp mỗi khung — quá {@link SECTION_MAX_INLINE} thì cắt bớt + nút "+N" riêng cho khung đó. */
const SECTION_MAX_INLINE = 3;

/** 1 khung riêng (giảng viên HOẶC nhóm) trong ô — quá ngưỡng thì có popover riêng của chính khung đó. */
function SectionBox({
  tone,
  title,
  ids,
  renderCard,
  dateLabel,
  timeLabel,
}: {
  tone: "orange" | "violet";
  title: string;
  ids: number[];
  renderCard: (id: number, index: number) => ReactNode;
  dateLabel: string;
  timeLabel: string;
}) {
  if (ids.length === 0) return null;
  const overflow = ids.length > SECTION_MAX_INLINE ? ids.length - SECTION_MAX_INLINE : 0;
  const visible = overflow > 0 ? ids.slice(0, SECTION_MAX_INLINE) : ids;

  return (
    <div className={cn("space-y-1 rounded-md p-1", tone === "orange" ? "bg-orange-500/5" : "bg-violet-500/5")}>
      {visible.map((id, index) => renderCard(id, index))}
      {overflow > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="w-full rounded-md border border-border bg-muted px-2 py-1 text-center text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
              >
                +{overflow}
              </button>
            }
          />
          <PopoverContent side="right" align="start" className="w-72 space-y-2">
            <div>
              <p className="text-sm font-semibold">
                {dateLabel} · {timeLabel}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", tone === "orange" ? "bg-orange-500" : "bg-violet-500")} aria-hidden />
                {title} ({ids.length})
              </p>
            </div>
            <div className="max-h-72 space-y-1.5 overflow-y-auto">{ids.map((id, index) => renderCard(id, index))}</div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * 1 ô ngày × giờ — 2 khung riêng biệt (không dồn chung): giảng viên rảnh (trên) / nhóm đã chọn
 * (dưới). Mỗi khung hiện tối đa {@link SECTION_MAX_INLINE} card, vượt quá thì có nút "+N" và
 * popover riêng của chính khung đó — 2 khung không chia sẻ chung 1 popover.
 */
function TimeslotCell({
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
  const topBorder = isNowRow ? "border-t-2 border-t-primary/70" : "border-t border-border";

  if (lecturerIds.length === 0 && groupIds.length === 0) {
    return (
      <div
        className={cn("min-h-full border-l border-border bg-background", topBorder, isToday && "bg-foreground/2")}
        aria-label="Chưa có lựa chọn"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border-l border-border p-1.5 transition-shadow duration-200",
        topBorder,
        isToday && "bg-foreground/2",
        "hover:relative hover:z-10 hover:shadow-md hover:ring-1 hover:ring-border"
      )}
    >
      <SectionBox
        tone="orange"
        title="Giảng viên"
        ids={lecturerIds}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        renderCard={(id, index) => (
          <PersonCard
            key={id}
            tone="orange"
            code={lecturerById.get(id)?.code ?? `GV${id}`}
            subtitle={lecturerById.get(id)?.fullName}
            index={index}
          />
        )}
      />
      <SectionBox
        tone="violet"
        title="Nhóm"
        ids={groupIds}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        renderCard={(id, index) => <PersonCard key={id} tone="violet" code={groupCodeById.get(id) ?? `#${id}`} index={index} />}
      />
    </div>
  );
}

/**
 * Cột giữa (giai đoạn chưa có phương án ACTIVE/PUBLISHED) — lịch xếp ca: mỗi giảng viên rảnh /
 * nhóm đã chọn hiện thành 1 thẻ riêng trong đúng ô ngày-giờ, nhiều thẻ xếp cạnh nhau trong cùng
 * khung. Ô không phải khung giờ thật của round hiện xám và không tương tác. Mượn phong cách lưới +
 * banner từ `RoundScheduleCalendar` (bước 2 wizard tạo round) chứ không phải chính component đó
 * (component đó chỉnh sửa draft cục bộ, không đọc dữ liệu lịch rảnh thật).
 */
export function RoundAvailabilityHeatmap({
  roundId,
  round,
  hasVersions,
  readiness,
  onRunSchedule,
  runPending,
}: {
  roundId: string;
  round: RoundDetail;
  hasVersions: boolean;
  readiness: SchedulingReadiness | undefined;
  onRunSchedule: () => void;
  runPending: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { date: nowDate, time: nowTime } = useNowInVietnamTime();
  const legacyRoundId = Number(roundId);
  const { data: availability, isLoading, isError } = useRoundMyAvailability(legacyRoundId);
  const { data: invitations } = useRoundInvitations(roundId);
  const { currentSemester } = useSemesterContext();
  const { data: groupsResult } = useGroups(currentSemester?.id);
  const updateRound = useUpdateRound();

  const canEditDeadline = round.status === "DRAFT" || round.status === "OPEN_REGISTRATION";
  const canRun = readiness?.ready ?? false;

  /** Luôn hiện đủ 7 ngày liên tiếp để giữ đúng layout tuần của Round Calendar. */
  const dates = useMemo(() => {
    const anchor = round.startDate || availability?.timeslots[0]?.day_date;
    if (!anchor) return [];
    return Array.from({ length: 7 }, (_, index) => addDaysStr(anchor, index));
  }, [round.startDate, availability]);

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
        const start = formatInVietnamTime(slot.start_at, "HH:mm");
        const end = formatInVietnamTime(slot.end_at, "HH:mm");
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
      const date = formatInVietnamTime(slot.start_at, "YYYY-MM-DD");
      const startTime = formatInVietnamTime(slot.start_at, "HH:mm");
      map.set(`${date}__${startTime}`, slot);
    }
    return map;
  }, [availability]);

  const lecturerAvailableByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selected_by_lecturer ?? []) {
      if (row.state !== "AVAILABLE") continue;
      if (!map.has(row.timeslot_id)) map.set(row.timeslot_id, new Set());
      map.get(row.timeslot_id)!.add(row.lecturer_id);
    }
    return map;
  }, [availability]);

  const groupSelectedByTimeslot = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selected_by_group ?? []) {
      if (!row.selected) continue;
      if (!map.has(row.timeslot_id)) map.set(row.timeslot_id, new Set());
      map.get(row.timeslot_id)!.add(row.group_id);
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
    for (const g of groupsResult?.data ?? []) map.set(Number(g.id), g.code);
    return map;
  }, [groupsResult]);

  const deadlineDate = round.registrationDeadline ? formatInVietnamTime(round.registrationDeadline, "YYYY-MM-DD") : null;
  const deadlineTime = round.registrationDeadline ? formatInVietnamTime(round.registrationDeadline, "HH:mm") : "23:59";
  const [deadlineDraftDate, setDeadlineDraftDate] = useState(() => deadlineDate ?? "");
  const [deadlineDraftTime, setDeadlineDraftTime] = useState(() => deadlineTime);

  function updateDeadline(date: string, time: string) {
    if (!canEditDeadline || updateRound.isPending || !date || date > round.startDate) return;
    updateRound.mutate({ roundId, payload: { registrationDeadline: buildDeadlineIso(date, time) } });
  }

  const runLabel = runPending ? "Đang chạy..." : hasVersions ? "Chạy lại" : "Chạy xếp lịch";

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-104 flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-pretty text-amber-700 dark:text-amber-400">
            {canEditDeadline
              ? "Đặt hạn đăng ký trước hoặc đúng ngày bắt đầu chấm; lưới bên dưới chỉ hiển thị lịch rảnh."
              : deadlineDate
                ? `Hạn đăng ký: ${formatDate(deadlineDate, "DD/MM/YYYY")} — đợt đã qua giai đoạn chỉnh sửa.`
                : "Đợt đã qua giai đoạn chỉnh sửa hạn đăng ký."}
          </p>
        </div>
        <Button size="default" variant={"default"} disabled={runPending || !canRun} onClick={onRunSchedule}>
          <Sparkles />
          {runLabel}
        </Button>
      </div>

      <div className="flex shrink-0 flex-wrap items-end gap-4 border-b border-border py-4">
        <div className="space-y-1.5">
          <label htmlFor="detail-registration-deadline-date" className="text-xs font-medium text-foreground">
            Hạn đăng ký chọn lịch
          </label>
          <DateField
            id="detail-registration-deadline-date"
            ariaLabel="Hạn đăng ký chọn lịch"
            value={deadlineDraftDate}
            max={round.startDate || undefined}
            disabled={!canEditDeadline || updateRound.isPending}
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
            disabled={!canEditDeadline || updateRound.isPending}
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

      <div className="flex min-h-0 flex-1 flex-col pt-4">
        {isLoading && <Skeleton className="h-56 w-full" />}
        {isError && <ErrorBlock label="Không tải được lịch rảnh." />}

        {availability && dates.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Round chưa có khung giờ nào.</p>
        )}

        {availability && dates.length > 0 && (
          <div className="flex-1 overflow-auto">
            <div
              className="grid h-full"
              style={{
                gridTemplateColumns: `56px repeat(${dates.length}, minmax(104px, 1fr))`,
                gridTemplateRows: `64px repeat(${timeRows.length}, minmax(64px, 1fr))`,
              }}
            >
              <div className="sticky top-0 left-0 z-30 border-r border-b border-border bg-background" />
              {dates.map((date) => {
                const isDeadline = date === deadlineDate;
                const isToday = date === nowDate;
                return (
                  <div
                    key={date}
                    className={cn(
                      "sticky top-0 z-20 flex flex-col items-center justify-center gap-1 border-b border-l border-border bg-background py-2",
                    )}
                  >
                    <span className="text-[11px] font-medium text-muted-foreground capitalize">{formatDate(date, "dd")}</span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-shadow",
                        isDeadline ? "bg-amber-500 text-white" : "text-foreground",
                        !isDeadline && isToday && "ring-2 ring-primary/50"
                      )}
                    >
                      {formatDate(date, "DD")}
                    </span>
                  </div>
                );
              })}

              {timeRows.map((row) => {
                const isNowRow = nowTime >= row.start && nowTime < row.end;
                return (
                  <div key={row.start} className="contents">
                    <div
                      className={cn(
                        "sticky left-0 z-10 flex items-center justify-end gap-1.5 border-r border-border bg-background pr-2 text-[11px] font-medium tabular-nums transition-colors",
                        isNowRow ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {isNowRow && (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
                      )}
                      {row.start}
                    </div>
                    {dates.map((date) => {
                      const cellKey = `${date}__${row.start}`;
                      const roundSlot = roundSlotByCell.get(cellKey);
                      const timeslot = timeslotByCell.get(cellKey);
                      const isToday = date === nowDate;
                      const topBorder = isNowRow ? "border-t-2 border-t-primary/70" : "border-t border-border";

                      if (!roundSlot) {
                        return (
                          <div
                            key={`${date}-${row.start}`}
                            aria-disabled
                            className={cn("border-l border-primary/20 bg-primary/5", topBorder)}
                          />
                        );
                      }

                      if (!timeslot) {
                        return (
                          <div
                            key={`${date}-${row.start}`}
                            className={cn("border-l border-border bg-background", topBorder, isToday && "bg-foreground/2")}
                            title={`Khung giờ ${roundSlot.startTime} – ${roundSlot.endTime}`}
                          />
                        );
                      }

                      const lecturerIds = Array.from(lecturerAvailableByTimeslot.get(timeslot.id) ?? []);
                      const groupIds = Array.from(groupSelectedByTimeslot.get(timeslot.id) ?? []);

                      return (
                        <TimeslotCell
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
