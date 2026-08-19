"use client";

import { cn } from "@/lib/utils";

export type ScheduleView = "list" | "week";

const OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: "list", label: "Danh sách" },
  { value: "week", label: "Tuần" },
];

export function ViewToggle({ value, onChange }: { value: ScheduleView; onChange: (v: ScheduleView) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="tablist">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
