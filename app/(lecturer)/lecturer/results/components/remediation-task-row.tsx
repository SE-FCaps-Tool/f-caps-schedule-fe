"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import type { RemediationTask } from "./mock-data";
import { toneBadgeClass } from "./tone";

export function RemediationTaskRow({
  task,
  verified,
  onVerify,
}: {
  task: RemediationTask;
  verified?: "passed" | "overdue";
  onVerify: (status: "passed" | "overdue") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border py-3.5 first:border-t last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold">Khắc phục Defense 1.1</p>
          <span className="font-mono text-xs text-muted-foreground">{task.groupCode}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.groupTitleVi}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Hạn: <span className="font-medium tabular-nums text-foreground">{formatDate(task.dueDate, "dddd, DD/MM/YYYY")}</span>
        </p>
      </div>

      {verified ? (
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[verified === "passed" ? "emerald" : "red"])}>
          {verified === "passed" ? "Đã khắc phục" : "Chưa đạt"}
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onVerify("overdue")} className="text-destructive hover:text-destructive">
            <X />
            Chưa đạt
          </Button>
          <Button size="sm" onClick={() => onVerify("passed")}>
            <Check />
            Đã khắc phục
          </Button>
        </div>
      )}
    </div>
  );
}
