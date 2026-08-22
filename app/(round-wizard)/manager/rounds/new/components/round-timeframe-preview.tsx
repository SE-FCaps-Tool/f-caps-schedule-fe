import { AlertTriangle, CalendarClock, Clock3, Layers3, RotateCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Timeframe, TimeframeBlock } from "@/lib/api/services/fetchTimeframes";

function displayTime(value: string) {
  return value.slice(0, 5);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} giờ ${remainder} phút` : `${hours} giờ`;
}

function TimelineRow({ block }: { block: TimeframeBlock }) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-background p-3 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Clock3 className="size-4" aria-hidden />
        </span>
        <span>
          {displayTime(block.startTime)} — {displayTime(block.endTime)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{block.groupSlots.length} nhóm trong timeline</span>
          <span className="tabular-nums">{formatDuration(block.groupSlots.reduce((total, slot) => total + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0))}</span>
        </div>
        <div className="grid gap-1.5 sm:grid-flow-col sm:auto-cols-fr">
          {block.groupSlots.map((slot) => (
            <div
              key={slot.sequenceNumber}
              className="rounded-md bg-primary/10 px-2 py-1.5 text-center text-[11px] font-medium tabular-nums text-primary"
              title={`${displayTime(slot.startTime)} — ${displayTime(slot.endTime)}`}
            >
              Nhóm {slot.sequenceNumber}
              <span className="mt-0.5 block text-[10px] font-normal text-primary/75">
                {displayTime(slot.startTime)}–{displayTime(slot.endTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function RoundTimeframePreview({
  timeframe,
  isLoading = false,
  isError = false,
  onRetry,
  className,
}: {
  timeframe: Timeframe | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3 rounded-2xl border border-border bg-card p-4", className)}>
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("rounded-2xl border border-destructive/30 bg-destructive/5 p-4", className)}>
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Không tải được Timeframe</p>
            <p className="mt-1 text-xs leading-5 text-destructive/80">
              Kiểm tra lại cấu hình hoặc thử tải lại danh sách trước khi tạo Round.
            </p>
          </div>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RotateCw /> Thử lại
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!timeframe) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center", className)}>
        <CalendarClock className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm font-medium">Chưa chọn Timeframe</p>
        <p className="mt-1 text-xs text-muted-foreground">Chọn một cấu hình để xem timeline và sức chứa trước khi tạo Round.</p>
      </div>
    );
  }

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)} aria-label="Preview Timeframe">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{timeframe.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {timeframe.type} · Revision {timeframe.version?.number ?? "—"} · {timeframe.version?.status ?? "ACTIVE"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Clock3 className="size-3.5" aria-hidden /> {timeframe.groupDurationMinutes} phút/nhóm
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Layers3 className="size-3.5" aria-hidden /> {timeframe.blocksPerDay} timeline/ngày
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Users className="size-3.5" aria-hidden /> {timeframe.capacityPerDay} nhóm/ngày
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-4 sm:p-5">
        {timeframe.blocks.map((block) => (
          <TimelineRow key={block.sequenceNumber} block={block} />
        ))}
        {timeframe.breakWindows.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            {timeframe.breakWindows.map((breakWindow) => (
              <span key={`${breakWindow.startTime}-${breakWindow.endTime}`} className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                {breakWindow.name}: {displayTime(breakWindow.startTime)}–{displayTime(breakWindow.endTime)}
              </span>
            ))}
          </div>
        )}
        <p className="pt-1 text-xs leading-5 text-muted-foreground">
          Backend sẽ dùng các group slot này để sinh timeslot cho từng ngày của Round. FE chỉ hiển thị preview.
        </p>
      </div>
    </section>
  );
}
