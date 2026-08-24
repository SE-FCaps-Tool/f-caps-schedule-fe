"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import { RoundAvailabilityHeatmap } from "./round-availability-heatmap";
import { ScheduleVariantsPanel } from "./schedule-variants-panel";

type RoundCalendarTab = "registrations" | "preview" | "manual-schedule";

const TABS: Array<{ value: RoundCalendarTab; label: string; icon: typeof CalendarDays }> = [
  { value: "registrations", label: "Đăng ký lịch", icon: CalendarDays },
  { value: "preview", label: "Xem trước", icon: Sparkles },
  { value: "manual-schedule", label: "Xếp lịch", icon: Pencil },
];

/** Cột giữa — chuyển giữa đăng ký, xem trước phương án và xếp lịch thủ công. */
export function RoundCalendarPanel({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const [activeTab, setActiveTab] = useState<RoundCalendarTab>("registrations");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1" role="tablist" aria-label="Lịch round">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;
            const className = cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            );

            if (tab.value === "manual-schedule") {
              return (
                <Link
                  key={tab.value}
                  href={`/manager/rounds/${roundId}/manual-schedule`}
                  role="tab"
                  aria-selected={false}
                  className={className}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </Link>
              );
            }

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.value)}
                className={className}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "registrations" && <RoundAvailabilityHeatmap roundId={roundId} round={round} />}
        {activeTab === "preview" && <ScheduleVariantsPanel roundId={roundId} round={round} />}
      </div>
    </div>
  );
}
