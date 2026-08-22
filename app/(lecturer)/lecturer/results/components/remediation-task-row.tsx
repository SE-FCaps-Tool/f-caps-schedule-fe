"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import type { LecturerRemediation } from "@/lib/api/services/fetchLecturerPortal";
import { useVerifyLecturerRemediation } from "@/hooks/lecturer/useLecturerPortal";
import { REMEDIATION_STATUS_META } from "../../_shared/labels";
import { toneBadgeClass } from "../../_shared/status-dot";

export function RemediationTaskRow({ task }: { task: LecturerRemediation }) {
  const verify = useVerifyLecturerRemediation();
  const meta = REMEDIATION_STATUS_META[task.status];
  const isPending = task.status === "PENDING";

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border py-3.5 first:border-t last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold">Khắc phục Review 3</p>
          <span className="font-mono text-xs text-muted-foreground">{task.group.code}</span>
        </div>
        {task.group.projectTitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.group.projectTitle}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Hạn: <span className="font-medium tabular-nums text-foreground">{formatDate(task.deadline, "dddd, DD/MM/YYYY")}</span>
        </p>
      </div>

      {isPending ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={verify.isPending}
            onClick={() => verify.mutate({ remediationId: task.id, payload: { decision: "FAIL" } })}
            className="text-destructive hover:text-destructive"
          >
            <X />
            Chưa đạt
          </Button>
          <Button
            disabled={verify.isPending}
            onClick={() => verify.mutate({ remediationId: task.id, payload: { decision: "PASS" } })}
          >
            <Check />
            Đã khắc phục
          </Button>
        </div>
      ) : (
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[meta.tone])}>
          {meta.label}
        </span>
      )}
    </div>
  );
}
