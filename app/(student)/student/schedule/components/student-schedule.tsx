"use client";

import { useMemo } from "react";
import { WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderDashboard, useLeaderSessions } from "@/hooks/student/useLeaderPortal";
import { ScheduleCalendar } from "./schedule-calendar";
import { toStudentScheduleData } from "./types";

export function StudentSchedule() {
  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError } = useLeaderDashboard();
  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError } = useLeaderSessions();

  const data = useMemo(() => {
    if (!dashboard || !sessions) return null;
    return toStudentScheduleData(
      { code: dashboard.group.code, projectTitleEn: dashboard.project?.titleEn ?? null },
      sessions
    );
  }, [dashboard, sessions]);

  const isLoading = dashboardLoading || sessionsLoading;
  const isError = dashboardError || sessionsError;

  if (isLoading) {
    return (
      <div className="h-full space-y-2 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <WifiOff className="size-4 shrink-0" />
        Không tải được lịch nhóm. Thử tải lại trang.
      </div>
    );
  }

  return <ScheduleCalendar data={data} />;
}
