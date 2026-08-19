"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Skeleton } from "@/components/ui/skeleton";
import { useLecturerSessions } from "@/hooks/lecturer/useLecturerPortal";
import { toLecturerSession } from "./types";
import { ExportIcsButton } from "./export-ics-button";
import { ScheduleListView } from "./schedule-list-view";
import { ViewToggle, type ScheduleView } from "./view-toggle";
import { TimeGrid } from "./time-grid";

const TODAY_ISO = new Date().toISOString();

function mondayOf(iso: string) {
  const date = new Date(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function LecturerSchedule() {
  const [view, setView] = useState<ScheduleView>("list");
  const [weekStart, setWeekStart] = useState(() => mondayOf(TODAY_ISO));

  const { data, isLoading, isError } = useLecturerSessions();
  const sessions = useMemo(() => (data ?? []).map(toLecturerSession), [data]);

  const upcomingCount = useMemo(() => sessions.filter((s) => s.status === "SCHEDULED").length, [sessions]);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart === mondayOf(TODAY_ISO);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Lịch của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {upcomingCount} phiên sắp diễn ra · vai trò Reviewer / Result Owner theo phân công của Bộ môn.
        </p>
      </div>

      <div className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <ViewToggle value={view} onChange={setView} />

        <div className="flex items-center gap-3">
          {view === "week" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                aria-label="Tuần trước"
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(mondayOf(TODAY_ISO))}
                className={cn(
                  "min-h-10 rounded-md px-2.5 text-sm font-medium",
                  isCurrentWeek ? "text-muted-foreground" : "text-primary hover:bg-secondary"
                )}
              >
                {formatDate(weekStart, "DD/MM")} – {formatDate(weekEnd, "DD/MM")}
              </button>
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                aria-label="Tuần sau"
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          <ExportIcsButton sessions={sessions} />
        </div>
      </div>

      <div className={cn("mt-6 min-h-0 flex-1", view === "list" ? "overflow-y-auto" : "overflow-hidden")}>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được lịch. Thử tải lại trang.
          </div>
        )}
        {!isLoading && !isError && view === "list" && <ScheduleListView sessions={sessions} todayIso={TODAY_ISO} />}
        {!isLoading && !isError && view === "week" && (
          <TimeGrid weekStartIso={weekStart} sessions={sessions} todayIso={TODAY_ISO} />
        )}
      </div>
    </div>
  );
}
