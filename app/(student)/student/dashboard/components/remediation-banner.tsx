import { AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { LeaderDashboard } from "@/lib/api/services/fetchLeaderPortal";
import { REMEDIATION_STATUS_META } from "../../_shared/labels";
import { toneBadgeClass } from "../../_shared/status-dot";

const STATUS_ICON = {
  PENDING: Hourglass,
  PASSED: CheckCircle2,
  OVERDUE: AlertTriangle,
  FAILED: AlertTriangle,
} as const;

export function RemediationBanner({ remediation }: { remediation: NonNullable<LeaderDashboard["remediation"]> }) {
  const meta = REMEDIATION_STATUS_META[remediation.status];
  const Icon = STATUS_ICON[remediation.status];

  return (
    <div className="rounded-lg bg-amber-50/60 p-3.5 dark:bg-amber-500/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Hạn khắc phục Review 3</p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            toneBadgeClass[meta.tone]
          )}
        >
          <Icon className="size-3.5" />
          {meta.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm tabular-nums">{formatDate(remediation.deadline, "dddd, DD/MM/YYYY")}</p>
    </div>
  );
}
