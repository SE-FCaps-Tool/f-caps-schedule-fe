"use client";

import { useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Download, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StatusDot } from "../../_shared/status-dot";
import { DEFENSE_CONCLUSION_META, type DefenseConclusion } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import {
  useLecturerLoadReport,
  useOutcomesReport,
  useQualityReport,
  useRemediationReport,
  useExportSchedule,
  useExportResults,
} from "@/hooks/manager/useReports";

function notImplemented(action: string) {
  toast.info(`${action} — chưa nối backend`);
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-muted-foreground">{children}</h2>;
}

interface AttentionItem {
  key: string;
  groupCode: string;
  label: string;
  href: string;
}

export function ReportsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: lecturerLoad, isLoading: loadLoading, isError: loadError } = useLecturerLoadReport(currentSemester?.id);
  const { data: outcomes, isLoading: outcomesLoading, isError: outcomesError } = useOutcomesReport(currentSemester?.id);
  const { data: quality } = useQualityReport(currentSemester?.id);
  const { data: remediation } = useRemediationReport(currentSemester?.id);
  const exportSchedule = useExportSchedule();
  const exportResults = useExportResults();

  const defenseOutcomes = useMemo(
    () => (outcomes?.rows ?? []).filter((r) => r.type === "DEFENSE_1_1" || r.type === "REVIEW_3"),
    [outcomes]
  );
  const defenseTotal = defenseOutcomes.reduce((sum, r) => sum + r.count, 0);

  const attentionItems: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];
    for (const row of quality?.rows ?? []) {
      if (row.leaders !== 1) {
        items.push({ key: `${row.id}-leader`, groupCode: row.code, label: "Chưa có Leader", href: "/manager/groups" });
      }
      if (row.active_members < 4) {
        items.push({ key: `${row.id}-members`, groupCode: row.code, label: "Dưới 4 thành viên", href: "/manager/groups" });
      }
    }
    for (const row of remediation?.rows ?? []) {
      if (row.status === "OVERDUE") {
        items.push({ key: `${row.id}-overdue`, groupCode: row.group_code, label: "Khắc phục quá hạn", href: "/manager/results" });
      }
    }
    return items;
  }, [quality, remediation]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Báo cáo <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Học kỳ {currentSemesterId}</p>
      </div>

      <div className="mt-8">
        <SectionHeading>Tải giảng viên</SectionHeading>
        {loadLoading && (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {loadError && (
          <div className="mt-3 flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được báo cáo tải giảng viên.
          </div>
        )}
        {lecturerLoad && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Giảng viên</TableHead>
                  <TableHead className="text-right">Buổi</TableHead>
                  <TableHead className="text-right">Hạn mức</TableHead>
                  <TableHead className="pr-4">Sử dụng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturerLoad.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu tải giảng viên.
                    </TableCell>
                  </TableRow>
                )}
                {lecturerLoad.rows.map((row) => {
                  const isOver = row.quota_percent >= 90;
                  return (
                    <TableRow key={row.lecturer_id}>
                      <TableCell className="pl-4">
                        <span className="font-medium">{row.lecturer_code}</span>{" "}
                        <span className="text-muted-foreground">— {row.display_name}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.session_count}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.quota}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", isOver ? "bg-amber-500" : "bg-primary")}
                              style={{ width: `${Math.min(row.quota_percent, 100)}%` }}
                            />
                          </div>
                          <span className={cn("text-xs tabular-nums", isOver ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                            {row.quota_percent}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <SectionHeading>Kết quả — Review 3</SectionHeading>
        {outcomesLoading && <Skeleton className="mt-3 h-24 w-full" />}
        {outcomesError && (
          <div className="mt-3 flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được phân bố kết quả.
          </div>
        )}
        {outcomes && defenseOutcomes.length === 0 && (
          <p className="mt-3 py-6 text-sm text-muted-foreground">Chưa có kết quả Review 3 nào trong học kỳ này.</p>
        )}
        {defenseOutcomes.length > 0 && (
          <div className="mt-3 space-y-3">
            {defenseOutcomes.map((row) => {
              const meta = DEFENSE_CONCLUSION_META[row.outcome as DefenseConclusion];
              const pct = defenseTotal > 0 ? Math.round((row.count / defenseTotal) * 100) : 0;
              const barTone =
                row.outcome === "LEVEL_1"
                  ? "bg-emerald-500"
                  : row.outcome === "LEVEL_2"
                    ? "bg-amber-500"
                    : row.outcome === "LEVEL_3"
                      ? "bg-orange-500"
                      : "bg-red-500";
              return (
                <div key={row.outcome} className="flex items-center gap-4">
                  <span className="w-16 shrink-0 text-sm font-medium">{meta?.label ?? row.outcome}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", barTone)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {row.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <SectionHeading>Nhóm cần chú ý</SectionHeading>
        <div className="mt-3">
          {attentionItems.length === 0 && <p className="py-6 text-sm text-muted-foreground">Không có nhóm nào cần chú ý.</p>}
          {attentionItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-4 border-b border-border py-3 transition-colors first:border-t last:border-b-0 hover:bg-muted/40"
            >
              <span className="w-14 shrink-0 font-mono text-xs font-medium">{item.groupCode}</span>
              <span className="min-w-0 flex-1">
                <StatusDot tone="amber" label={item.label} />
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading>Xuất dữ liệu</SectionHeading>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!currentSemester?.id || exportSchedule.isPending}
            onClick={() => currentSemester?.id && exportSchedule.mutate(currentSemester.id)}
          >
            <Download />
            {exportSchedule.isPending ? "Đang xuất..." : "Xuất lịch đánh giá"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentSemester?.id || exportResults.isPending}
            onClick={() => currentSemester?.id && exportResults.mutate(currentSemester.id)}
          >
            <Download />
            {exportResults.isPending ? "Đang xuất..." : "Xuất kết quả"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => notImplemented("Xuất workload")}>
            <Download />
            Xuất workload
          </Button>
          <Button variant="outline" size="sm" onClick={() => notImplemented("Xuất báo cáo học kỳ")}>
            <Download />
            Xuất báo cáo học kỳ
          </Button>
        </div>
      </div>
    </div>
  );
}
