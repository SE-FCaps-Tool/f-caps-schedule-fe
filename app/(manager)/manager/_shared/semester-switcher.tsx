"use client";

import { CalendarRange } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SEMESTER_STATUS_DOT } from "@/components/semesters/status";
import { useSemesterContext } from "./semester-context";

export function SemesterSwitcher() {
  const { currentSemesterId, semesters, isLoading, setCurrentSemesterId } = useSemesterContext();

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse rounded-md bg-muted" aria-hidden />;
  }

  return (
    <Select value={currentSemesterId} onValueChange={(v) => v && setCurrentSemesterId(v)}>
      <SelectTrigger className="h-8 gap-1.5 border-none bg-transparent px-2 shadow-none hover:bg-muted">
        <CalendarRange className="size-3.5 text-muted-foreground" />
        <SelectValue placeholder="Chọn học kỳ">
          {(v: string | null) => (v ? <span className="font-medium">{v}</span> : "Chọn học kỳ")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="w-64">
        {semesters.map((s) => (
          <SelectItem key={s.code} value={s.code}>
            <span className="flex items-center gap-2">
              <span className={cn("size-1.5 shrink-0 rounded-full", SEMESTER_STATUS_DOT[s.status])} aria-hidden />
              <span className="font-mono text-xs font-medium">{s.code}</span>
              <span className="truncate text-muted-foreground">— {s.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
