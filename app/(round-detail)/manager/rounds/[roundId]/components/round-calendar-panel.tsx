"use client";

import Link from "next/link";
import { CalendarDays, Pencil } from "lucide-react";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import { RoundAvailabilityHeatmap } from "./round-availability-heatmap";

/** Cột giữa — hiển thị đăng ký; mọi thao tác xếp lịch nằm trong workspace riêng. */
export function RoundCalendarPanel({ roundId, round }: { roundId: string; round: RoundDetail }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="inline-flex h-8 items-center gap-1.5 rounded-md bg-muted/60 px-2 text-sm font-medium text-foreground">
          <CalendarDays className="size-4" />
          Đăng ký lịch
        </div>
        <Link
          href={`/manager/rounds/${roundId}/manual-schedule`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Pencil className="size-4" />
          Mở workspace xếp lịch
        </Link>
      </div>

      <div className="min-h-0 flex-1">
        <RoundAvailabilityHeatmap roundId={roundId} round={round} />
      </div>
    </div>
  );
}
