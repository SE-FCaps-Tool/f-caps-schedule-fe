"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Gauge, Minus, RefreshCw, Save, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { PREFERRED_LOAD_LABEL } from "../../../_shared/labels";
import { useLecturerAvailability, useSubmitAvailability } from "@/hooks/lecturer/useLecturerPortal";
import type { LecturerAvailability, PreferredLoad } from "@/lib/api/services/fetchLecturerPortal";
import { friendlyErrorMessage } from "@/lib/api/errorDetail";
import type { ApiError } from "@/types/api";

// Select cần 1 giá trị luôn xác định ngay từ lần render đầu (Base UI khoá controlled/uncontrolled
// theo lần render đầu tiên) — dùng sentinel thay cho `undefined` khi preferredLoad còn null.
const UNSET_PREFERRED_LOAD = "__unset";

function AvailabilityForm({ roundId, availability }: { roundId: string; availability: LecturerAvailability }) {
  const submitAvailability = useSubmitAvailability(roundId);

  const [preferredLoad, setPreferredLoad] = useState<PreferredLoad | null>(availability.preferredLoad);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(availability.slots.filter((slot) => slot.available).map((slot) => slot.timeslotId))
  );

  const dates = useMemo(() => Array.from(new Set(availability.slots.map((slot) => slot.date))).sort(), [availability.slots]);
  const timeRows = useMemo(() => {
    const rows = new Map<string, string>();
    for (const slot of availability.slots) rows.set(slot.startTime, slot.endTime);
    return Array.from(rows, ([startTime, endTime]) => ({ startTime, endTime })).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availability.slots]);
  const slotsByKey = useMemo(
    () => new Map(availability.slots.map((slot) => [`${slot.date}-${slot.startTime}`, slot])),
    [availability.slots]
  );
  const selectedCount = selected.size;

  function toggle(timeslotId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(timeslotId)) next.delete(timeslotId);
      else next.add(timeslotId);
      return next;
    });
  }

  function handleSubmit() {
    if (preferredLoad === null) return;
    submitAvailability.mutate({
      preferredLoad,
      slots: availability.slots.map((slot) => ({ timeslotId: slot.timeslotId, available: selected.has(slot.timeslotId) })),
    });
  }

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Chọn khung giờ rảnh</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Cập nhật lịch rảnh để bộ môn sắp xếp phiên đánh giá phù hợp.</p>
        </div>

        <div className="order-2 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end">
          <div className="flex items-center gap-3 pr-1 text-xs text-muted-foreground" aria-label="Chú thích lịch rảnh">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <Check className="size-3.5" />
              </span>
              Rảnh
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-md border border-border text-muted-foreground">
                <Minus className="size-3.5" />
              </span>
              Không rảnh
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
              <Gauge className="size-4" />
            </span>
            <Label htmlFor="preferred-load" className="text-xs text-muted-foreground">Mức tải</Label>
            <Select
              value={preferredLoad ?? UNSET_PREFERRED_LOAD}
              onValueChange={(value) => value && value !== UNSET_PREFERRED_LOAD && setPreferredLoad(value as PreferredLoad)}
            >
              <SelectTrigger id="preferred-load" className="h-9 w-40">
                <SelectValue placeholder="Chọn mức tải">
                  {(value: string) => (value === UNSET_PREFERRED_LOAD ? "Chọn mức tải" : PREFERRED_LOAD_LABEL[value as PreferredLoad])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PREFERRED_LOAD_LABEL) as PreferredLoad[]).map((load) => (
                  <SelectItem key={load} value={load}>
                    {PREFERRED_LOAD_LABEL[load]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-medium text-emerald-800">
            Đã chọn <strong className="text-emerald-700 tabular-nums">{selectedCount}</strong>
          </span>
          <Button
            size="default"
            disabled={submitAvailability.isPending || preferredLoad === null || dates.length === 0}
            onClick={handleSubmit}
          >
            <Save className="size-4" />
            {submitAvailability.isPending ? "Đang lưu..." : "Lưu lịch rảnh"}
          </Button>
        </div>
      </header>

      {dates.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <CalendarDays className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Đợt này chưa có khung giờ</p>
          <p className="mt-1 text-sm text-muted-foreground">Bạn chưa thể gửi lịch rảnh cho đến khi timeslot được mở.</p>
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col" aria-label="Lịch khung giờ rảnh">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-full overflow-auto overscroll-contain">
              <table className="h-full w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-30 w-28 min-w-28 border-r border-b border-border bg-muted/95 px-3 py-2.5 text-left font-semibold text-muted-foreground backdrop-blur">
                      Thời gian
                    </th>
                    {dates.map((date) => (
                      <th key={date} className="sticky top-0 z-20 border-b border-l border-border bg-muted/95 px-3 py-2.5 text-center align-middle backdrop-blur">
                        <span className="block text-xs font-medium text-muted-foreground">{formatDate(date, "ddd")}</span>
                        <span className="mt-0.5 block text-sm font-semibold tabular-nums">{formatDate(date, "DD/MM")}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeRows.map((row) => (
                    <tr key={row.startTime}>
                      <th scope="row" className="sticky left-0 z-10 w-28 min-w-28 border-r border-b border-border bg-card px-3 py-2.5 text-left align-middle">
                        <span className="block text-xs font-semibold tabular-nums">{row.startTime}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground tabular-nums">đến {row.endTime}</span>
                      </th>
                      {dates.map((date) => {
                        const slot = slotsByKey.get(`${date}-${row.startTime}`);
                        if (!slot) {
                          return <td key={`${date}-${row.startTime}`} aria-disabled className="h-16 border-b border-l border-border bg-muted/30 p-2" />;
                        }

                        const isSelected = selected.has(slot.timeslotId);
                        return (
                          <td key={`${date}-${row.startTime}`} className="h-16 border-b border-l border-border p-2 text-center transition-colors hover:bg-muted/20">
                            <button
                              type="button"
                              onClick={() => toggle(slot.timeslotId)}
                              className={cn(
                                "inline-flex size-10 items-center justify-center rounded-lg border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                                isSelected
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-200"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                              )}
                              aria-pressed={isSelected}
                              aria-label={`${formatDate(date, "DD/MM")} ${row.startTime} — ${isSelected ? "rảnh" : "không rảnh"}`}
                            >
                              {isSelected ? <Check className="size-4" /> : <Minus className="size-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export function AvailabilityFormPage({ roundId }: { roundId: string }) {
  const { data: availability, isLoading, isError, error, refetch } = useLecturerAvailability(roundId);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <Link href="/lecturer/availability" className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Đăng ký lịch rảnh
      </Link>

      {isLoading && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}
      {isError && (
        <div className="min-h-0 flex-1 overflow-y-auto pt-4">
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <WifiOff className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Không tải được timeslot</p>
          <p className="mt-1 text-sm text-muted-foreground">{friendlyErrorMessage(error as unknown as ApiError, "Thử tải lại trang.")}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
          </div>
        </div>
      )}

      {availability && <AvailabilityForm roundId={roundId} availability={availability} />}
    </div>
  );
}
