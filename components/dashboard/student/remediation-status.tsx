import { AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { RoundResult } from "./mock-data";

const STATUS_META: Record<
  NonNullable<RoundResult["remediation"]>["status"],
  { label: string; icon: typeof Hourglass; className: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    icon: Hourglass,
    className: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  },
  passed: {
    label: "Đạt",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  overdue: {
    label: "Quá hạn",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
};

export function RemediationStatus({ remediation }: { remediation: NonNullable<RoundResult["remediation"]> }) {
  const meta = STATUS_META[remediation.status];
  const Icon = meta.icon;

  return (
    <div className="rounded-lg bg-amber-50/60 p-3.5 dark:bg-amber-500/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Hạn khắc phục</p>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.className)}>
          <Icon className="size-3.5" />
          {meta.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm tabular-nums">{formatDate(remediation.dueDate, "dddd, DD/MM/YYYY")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Người xác nhận: {remediation.verifier.name} · {remediation.verifier.code}
      </p>
    </div>
  );
}
