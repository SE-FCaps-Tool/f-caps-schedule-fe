"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { matchesSearch } from "@/app/(manager)/manager/calendar/components/day-grid";
import type { DisplaySession } from "@/app/(manager)/manager/calendar/components/types";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";

const MAX_INLINE = 3;

function GroupChip({ session, dimmed }: { session: DisplaySession; dimmed: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-left transition-opacity",
        dimmed && "opacity-30"
      )}
    >
      <p className="truncate text-xs font-semibold text-violet-700 dark:text-violet-400">{session.groupCode}</p>
      {session.reviewers.length > 0 && (
        <p className="truncate text-[11px] text-muted-foreground">{session.reviewers.map((r) => r.name).join(", ")}</p>
      )}
    </div>
  );
}

/**
 * Lịch ngày × giờ cho bản nháp CHƯA gán phòng (BE chỉ tạo phòng lúc kích hoạt — xem
 * round-calendar-panel.tsx). Mỗi ô là 1 khung giờ thật của round, hiện các nhóm được xếp vào đó
 * dạng thẻ xếp chồng (mượn đúng phong cách của `RoundAvailabilityHeatmap`), khác `DayGrid` — vốn
 * chia CỘT theo phòng nên không có gì để vẽ khi chưa có phòng.
 */
export function DraftScheduleGrid({ round, sessions, search }: { round: RoundDetail; sessions: DisplaySession[]; search: string }) {
  const dates = round.days.map((d) => d.date);

  const timeslotRows = (() => {
    const seen = new Map<string, { start: string; end: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) seen.set(slot.startTime, { start: slot.startTime, end: slot.endTime });
    }
    return Array.from(seen.values()).sort((a, b) => a.start.localeCompare(b.start));
  })();

  const roundSlotByCell = (() => {
    const map = new Map<string, { startTime: string; endTime: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) map.set(`${day.date}__${slot.startTime}`, slot);
    }
    return map;
  })();

  if (dates.length === 0 || timeslotRows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Round chưa có khung giờ nào.</p>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `72px repeat(${dates.length}, minmax(140px, 1fr))`,
          gridTemplateRows: `44px repeat(${timeslotRows.length}, minmax(72px, 1fr))`,
        }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b border-border bg-background" />
        {dates.map((date) => (
          <div
            key={date}
            className="sticky top-0 z-20 flex items-center justify-center gap-1.5 border-b border-l border-border bg-background py-2 text-sm font-medium"
          >
            <span className="text-muted-foreground capitalize">{formatDate(date, "dd")}</span>
            <span className="tabular-nums">{formatDate(date, "DD/MM")}</span>
          </div>
        ))}

        {timeslotRows.map((row) => (
          <div key={row.start} className="contents">
            <div className="sticky left-0 z-10 flex items-center justify-end border-r border-border bg-background pr-2 text-[11px] font-medium text-muted-foreground tabular-nums">
              {row.start}
            </div>
            {dates.map((date) => {
              const cellKey = `${date}__${row.start}`;
              const roundSlot = roundSlotByCell.get(cellKey);

              if (!roundSlot) {
                return <div key={cellKey} aria-disabled className="border-t border-l border-primary/20 bg-primary/5" />;
              }

              const cellSessions = sessions.filter((s) => s.date === date && s.start === row.start);
              if (cellSessions.length === 0) {
                return <div key={cellKey} className="border-t border-l border-border bg-background" />;
              }

              const overflow = cellSessions.length > MAX_INLINE ? cellSessions.length - MAX_INLINE : 0;
              const visible = overflow > 0 ? cellSessions.slice(0, MAX_INLINE) : cellSessions;

              return (
                <div key={cellKey} className="flex flex-col gap-1.5 border-t border-l border-border p-1.5">
                  {visible.map((s) => (
                    <GroupChip key={s.id} session={s} dimmed={!matchesSearch(s, search)} />
                  ))}
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
                      <PopoverContent side="right" align="start" className="w-72 space-y-1.5">
                        <p className="text-sm font-semibold">
                          {formatDate(date, "dddd, DD/MM")} · {row.start} – {row.end}
                        </p>
                        <div className="max-h-72 space-y-1.5 overflow-y-auto pt-1">
                          {cellSessions.map((s) => (
                            <GroupChip key={s.id} session={s} dimmed={!matchesSearch(s, search)} />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
