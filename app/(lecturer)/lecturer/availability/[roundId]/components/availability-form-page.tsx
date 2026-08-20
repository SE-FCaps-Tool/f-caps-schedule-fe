"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, WifiOff } from "lucide-react";
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
    () => new Set(availability.slots.filter((s) => s.available).map((s) => s.timeslotId))
  );

  const dates = useMemo(() => Array.from(new Set(availability.slots.map((s) => s.date))).sort(), [availability]);
  const times = useMemo(() => Array.from(new Set(availability.slots.map((s) => s.startTime))).sort(), [availability]);

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
      slots: availability.slots.map((s) => ({ timeslotId: s.timeslotId, available: selected.has(s.timeslotId) })),
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="max-w-xs space-y-1.5">
        <Label>Mức tải mong muốn</Label>
        <Select
          value={preferredLoad ?? UNSET_PREFERRED_LOAD}
          onValueChange={(v) => v && v !== UNSET_PREFERRED_LOAD && setPreferredLoad(v as PreferredLoad)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn mức tải">
              {(v: string) => (v === UNSET_PREFERRED_LOAD ? "Chọn mức tải" : PREFERRED_LOAD_LABEL[v as PreferredLoad])}
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
                    const slot = availability.slots.find((s) => s.date === date && s.startTime === t);
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
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                          aria-pressed={isSelected}
                          aria-label={`${formatDate(date, "DD/MM")} ${t} — ${isSelected ? "rảnh" : "bận"}`}
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

      <Button disabled={submitAvailability.isPending || preferredLoad === null} onClick={handleSubmit}>
        {submitAvailability.isPending ? "Đang lưu..." : "Lưu lịch rảnh"}
      </Button>
    </div>
  );
}

export function AvailabilityFormPage({ roundId }: { roundId: string }) {
  const { data: availability, isLoading, isError, error } = useLecturerAvailability(roundId);

  return (
    <div>
      <Link
        href="/lecturer/availability"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Đăng ký lịch rảnh
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Chọn timeslot rảnh</h1>

      {isLoading && (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && (
        <div className="mt-6 flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0" />
          {friendlyErrorMessage(error as unknown as ApiError, "Không tải được timeslot. Thử tải lại trang.")}
        </div>
      )}

      {availability && <AvailabilityForm roundId={roundId} availability={availability} />}
    </div>
  );
}
