"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadIcsCalendar } from "./build-ics";
import type { LecturerSession } from "./mock-data";

export function ExportIcsButton({ sessions }: { sessions: LecturerSession[] }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        downloadIcsCalendar(sessions);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
        done && "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"
      )}
    >
      {done ? <Check className="size-4" /> : <Download className="size-4" />}
      {done ? "Đã tải xuống" : "Xuất iCal"}
    </button>
  );
}
