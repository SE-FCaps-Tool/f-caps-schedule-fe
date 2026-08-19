"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { useLeaderDashboard, useGroupPreferences, useSubmitGroupPreferences } from "@/hooks/student/useLeaderPortal";
import type { GroupPreference } from "@/lib/api/services/fetchLeaderPortal";

function PreferenceGrid({
  roundId,
  groupId,
  slots,
}: {
  roundId: string;
  groupId: string;
  slots: GroupPreference[];
}) {
  const submit = useSubmitGroupPreferences(roundId, groupId);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(slots.filter((s) => s.selected).map((s) => s.timeslotId))
  );

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.date))).sort(), [slots]);
  const times = useMemo(() => Array.from(new Set(slots.map((s) => s.startTime))).sort(), [slots]);

  function toggle(timeslotId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(timeslotId)) next.delete(timeslotId);
      else next.add(timeslotId);
      return next;
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {dates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Đợt này chưa có timeslot.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-border p-2 text-left font-medium text-muted-foreground">Ngày</th>
                {times.map((t) => (
                  <th key={t} className="border-b border-border p-2 text-center font-medium text-muted-foreground tabular-nums">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr key={date}>
                  <td className="border-b border-border p-2 font-medium tabular-nums">{formatDate(date, "dd, DD/MM")}</td>
                  {times.map((t) => {
                    const slot = slots.find((s) => s.date === date && s.startTime === t);
                    if (!slot) return <td key={t} className="border-b border-border p-2" />;
                    const isSelected = selected.has(slot.timeslotId);
                    return (
                      <td key={t} className="border-b border-border p-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(slot.timeslotId)}
                          className={cn(
                            "size-8 rounded-md border text-sm font-medium transition-colors",
                            isSelected
                              ? "border-primary/40 bg-primary/15 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                          aria-pressed={isSelected}
                          aria-label={`${formatDate(date, "DD/MM")} ${t} — ${isSelected ? "đã chọn" : "chưa chọn"}`}
                        >
                          {isSelected ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        disabled={submit.isPending || selected.size === 0}
        onClick={() => submit.mutate({ timeslotIds: Array.from(selected) })}
      >
        {submit.isPending ? "Đang lưu..." : "Lưu nguyện vọng"}
      </Button>
    </div>
  );
}

export function PreferenceFormPage({ roundId }: { roundId: string }) {
  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError } = useLeaderDashboard();
  const groupId = dashboard?.group.id ?? null;
  const { data: slots, isLoading: slotsLoading, isError: slotsError } = useGroupPreferences(roundId, groupId);

  const isLoading = dashboardLoading || (groupId !== null && slotsLoading);
  const isError = dashboardError || slotsError;

  return (
    <div>
      <Link
        href="/student/preferences"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Đăng ký lịch
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Chọn khung giờ ưu tiên</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chỉ chọn được khi đợt đang mở đăng ký và bạn đang là Leader active của nhóm.
      </p>

      {isLoading && (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <div className="mt-6 flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0" />
          Không tải được timeslot. Thử tải lại trang.
        </div>
      )}

      {slots && groupId && <PreferenceGrid roundId={roundId} groupId={groupId} slots={slots} />}
    </div>
  );
}
