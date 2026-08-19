"use client";

import { useState } from "react";
import { MoreHorizontal, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../_shared/status-dot";
import { DEFENSE_CONCLUSION_META, REMEDIATION_STATUS_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRemediationCases, useOverdueFailRemediation } from "@/hooks/manager/useResults";
import { useLecturers } from "@/hooks/useLecturers";
import type { RemediationCase } from "@/lib/api/services/fetchResults";

const NEXT_STEP: Record<RemediationCase["status"], string> = {
  OPEN: "Chờ phản biện xác nhận",
  OVERDUE: "Chờ Manager xử lý (quá hạn)",
  PASSED: "Defense 1.2",
  FAILED: "FAILED",
};

export function ResultsPage() {
  const { currentSemesterId } = useSemesterContext();
  const { data: cases, isLoading, isError } = useRemediationCases();
  const { data: lecturers } = useLecturers();
  const overdueFail = useOverdueFailRemediation();
  const [pendingCase, setPendingCase] = useState<RemediationCase | null>(null);

  const overdueCount = cases?.filter((r) => r.status === "OVERDUE").length ?? 0;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kết quả & khắc phục <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cases ? `${cases.length} case khắc phục` : "…"}
          {overdueCount > 0 && <span className="text-destructive"> · {overdueCount} quá hạn</span>}
        </p>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách kết quả & khắc phục. Thử tải lại trang.
          </div>
        )}
        {cases && cases.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Chưa có case khắc phục nào trong học kỳ này.</p>
        )}
        {cases && cases.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nhóm</TableHead>
                  <TableHead>Đợt</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Khắc phục</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Phản biện xác nhận</TableHead>
                  <TableHead>Tiếp theo</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Hành động</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((row) => {
                  // Remediation case chỉ được tạo khi Defense 1.1 outcome = LEVEL_2 (§6 manager-api.md)
                  const resultMeta = DEFENSE_CONCLUSION_META.LEVEL_2;
                  const remediationMeta = REMEDIATION_STATUS_META[row.status];
                  const verifier = lecturers?.find((l) => l.id === row.verifier_lecturer_id);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{row.group_code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ROUND_TYPE_LABEL[row.round_type as keyof typeof ROUND_TYPE_LABEL] ?? row.round_type}
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={resultMeta.tone} label={resultMeta.label} />
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={remediationMeta.tone} label={remediationMeta.label} />
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{formatDate(row.due_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{verifier ? verifier.display_name : "—"}</TableCell>
                      <TableCell className={cn(row.status === "FAILED" ? "font-medium text-destructive" : "text-muted-foreground")}>
                        {NEXT_STEP[row.status]}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Hành động">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {row.status === "OVERDUE" && (
                              <DropdownMenuItem variant="destructive" onClick={() => setPendingCase(row)}>
                                Đánh dấu FAILED
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ReasonDialog
        open={pendingCase !== null}
        onOpenChange={(open) => !open && setPendingCase(null)}
        title="Đánh dấu FAILED do quá hạn"
        description={`Nhóm "${pendingCase?.group_code ?? ""}" đã quá hạn khắc phục mà chưa được phản biện xác nhận đạt. Lý do sẽ được ghi vào audit log.`}
        destructive
        confirmLabel="Đánh dấu FAILED"
        onConfirm={(reason) => {
          if (!pendingCase) return;
          overdueFail.mutate({ caseId: pendingCase.id, payload: { reason } });
          setPendingCase(null);
        }}
      />
    </div>
  );
}
