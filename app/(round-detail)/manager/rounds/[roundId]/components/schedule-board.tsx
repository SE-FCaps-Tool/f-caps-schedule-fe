"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { matchesSearch } from "@/app/(manager)/manager/calendar/components/day-grid";
import type { DisplaySession } from "@/app/(manager)/manager/calendar/components/types";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";

const MAX_INLINE = 4;

function reviewerSummary(session: DisplaySession) {
  const visible = session.reviewers.slice(0, 2).map((reviewer) => reviewer.name.split(" ").pop()).join(" · ");
  const remaining = Math.max(0, session.reviewers.length - 2);
  return remaining > 0 ? `${visible} +${remaining}` : visible;
}

function SessionChip({
  session,
  compact,
  dimmed,
  onSelect,
}: {
  session: DisplaySession;
  compact: boolean;
  dimmed: boolean;
  onSelect?: (id: string) => void;
}) {
  const content = (
    <>
      <span className="truncate font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">{session.groupCode}</span>
      <span className="truncate text-[11px] text-muted-foreground">{session.roomCode}</span>
      {session.reviewers.length > 0 && <span className="truncate text-[10px] text-muted-foreground">{reviewerSummary(session)}</span>}
    </>
  );
  const className = cn(
    "flex min-w-0 flex-col gap-0.5 overflow-hidden rounded-md border border-violet-500/30 bg-violet-500/10 text-left transition-colors",
    compact ? "px-2 py-1" : "px-2 py-1.5",
    dimmed && "opacity-30",
    onSelect && "cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  if (!onSelect) return <div className={className}>{content}</div>;
  return (
    <button type="button" className={className} onClick={() => onSelect(session.id)} aria-label={`Xem chi tiết ${session.groupCode}`}>
      {content}
    </button>
  );
}

/** Một bảng ngày × giờ dùng chung cho bản nháp và bản đã gán phòng. */
export function ScheduleBoard({
  round,
  sessions,
  search,
  compact = false,
  onSelect,
}: {
  round: RoundDetail;
  sessions: DisplaySession[];
  search: string;
  compact?: boolean;
  onSelect?: (id: string) => void;
}) {
  const dates = round.days.map((day) => day.date);
  const timeslotRows = (() => {
    const seen = new Map<string, { start: string; end: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) seen.set(slot.startTime, { start: slot.startTime, end: slot.endTime });
    }
    return Array.from(seen.values()).sort((a, b) => a.start.localeCompare(b.start));
  })();
  const sessionsByCell = new Map<string, DisplaySession[]>();
  for (const session of sessions) {
    const key = `${session.date}__${session.start}`;
    const bucket = sessionsByCell.get(key) ?? [];
    bucket.push(session);
    sessionsByCell.set(key, bucket);
  }

  if (dates.length === 0 || timeslotRows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Round chưa có khung giờ nào.</p>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <div
        className="grid min-w-[760px]"
        style={{ gridTemplateColumns: `72px repeat(${dates.length}, minmax(180px, 1fr))` }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b border-border bg-background" />
        {dates.map((date) => (
          <div key={date} className="sticky top-0 z-20 flex items-center justify-center gap-1.5 border-b border-l border-border bg-background px-2 py-2 text-sm font-medium">
            <span className="text-muted-foreground capitalize">{formatDate(date, "dd")}</span>
            <span className="tabular-nums">{formatDate(date, "DD/MM")}</span>
          </div>
        ))}

        {timeslotRows.map((row) => (
          <div key={row.start} className="contents">
            <div className="sticky left-0 z-10 flex min-h-[72px] items-start justify-end border-r border-border bg-background px-2 pt-2 text-[11px] font-medium text-muted-foreground tabular-nums">
              {row.start}
            </div>
            {dates.map((date) => {
              const cellKey = `${date}__${row.start}`;
              const cellSessions = sessionsByCell.get(cellKey) ?? [];
              const visible = cellSessions.slice(0, MAX_INLINE);
              const overflow = Math.max(0, cellSessions.length - visible.length);
              const hasRealSlot = round.days.find((day) => day.date === date)?.slots.some((slot) => slot.startTime === row.start);

              return (
                <div key={cellKey} className={cn("min-h-[72px] space-y-1 border-t border-l border-border p-1.5", !hasRealSlot && "bg-primary/5")}>
                  {visible.map((session) => (
                    <SessionChip key={session.id} session={session} compact={compact} dimmed={!matchesSearch(session, search)} onSelect={onSelect} />
                  ))}
                  {overflow > 0 && <div className="rounded-md border border-border bg-muted px-2 py-1 text-center text-xs font-semibold text-muted-foreground">+{overflow} buổi</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
