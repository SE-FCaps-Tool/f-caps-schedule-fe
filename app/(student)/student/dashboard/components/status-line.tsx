import { cn } from "@/lib/utils";
import { JOURNEY_STATUS_META, type StudentDashboardData } from "./mock-data";
import { toneDotClass } from "./tone";

function daysUntil(dateIso: string) {
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function StatusLine({ data }: { data: StudentDashboardData }) {
  const statusMeta = JOURNEY_STATUS_META[data.currentStatus];
  const upcoming = data.rounds.find((round) => round.phaseStatus === "upcoming");
  const days = upcoming?.date ? daysUntil(upcoming.date) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="font-mono font-medium text-foreground">{data.group.code}</span>
      <span className="text-muted-foreground/50">·</span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("size-1.5 shrink-0 rounded-full", toneDotClass[statusMeta.tone])} aria-hidden />
        {statusMeta.label}
      </span>
      {upcoming && days !== null && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">
            {upcoming.label}{" "}
            <span className={cn("font-medium", days <= 3 ? "text-primary" : "text-foreground")}>
              còn {Math.max(days, 0)} ngày
            </span>
          </span>
        </>
      )}
    </div>
  );
}
