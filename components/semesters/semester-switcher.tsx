"use client";

import { CalendarRange } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SEMESTER_STATUS_DOT } from "@/components/semesters/status";
import { useSemesterContext } from "./semester-context";

export function SemesterSwitcher() {
  const { currentSemesterId, semesters, isLoading, isError, setCurrentSemesterId } = useSemesterContext();

  if (isLoading) return <div className="h-8 w-32 animate-pulse rounded-md bg-muted" aria-hidden />;
  if (isError) return <span className="text-xs text-destructive">Không tải được học kỳ</span>;
  if (semesters.length === 0) return <span className="text-xs text-muted-foreground">Chưa có học kỳ liên quan</span>;

  return (
    <Select value={currentSemesterId ?? undefined} onValueChange={(value) => value && setCurrentSemesterId(value)}>
      <SelectTrigger
        className="h-8 gap-1.5 border-none bg-transparent px-2 shadow-none hover:bg-muted"
        aria-label="Chọn học kỳ"
      >
        <CalendarRange className="size-3.5 text-muted-foreground" />
        <SelectValue placeholder="Chọn học kỳ">
          {(value: string | null) => (value ? <span className="font-medium">{value}</span> : "Chọn học kỳ")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="w-64">
        {semesters.map((semester) => (
          <SelectItem key={semester.code} value={semester.code}>
            <span className="flex items-center gap-2">
              <span className={cn("size-1.5 shrink-0 rounded-full", SEMESTER_STATUS_DOT[semester.status])} aria-hidden />
              <span className="font-mono text-xs font-medium">{semester.code}</span>
              <span className="truncate text-muted-foreground">— {semester.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
