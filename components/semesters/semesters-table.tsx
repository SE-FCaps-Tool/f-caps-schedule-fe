"use client";

import { useState } from "react";
import { CalendarCheck, CalendarX2, Check, MoreHorizontal, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransitionSemester } from "@/hooks/useSemesters";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import type { SemesterApiItem, SemesterStatus } from "@/lib/api/services/fetchSemesters";
import { SEMESTER_STATUS_DOT, SEMESTER_STATUS_LABEL } from "./status";

const NEXT_STATUS: Partial<Record<SemesterStatus, SemesterStatus>> = {
  UPCOMING: "ACTIVE",
  ACTIVE: "CLOSED",
};

interface SemestersTableProps {
  semesters: SemesterApiItem[];
  /** Mã học kỳ đang được chọn làm bối cảnh làm việc (Manager). Bỏ qua nếu không dùng tính năng này. */
  currentContextId?: string | null;
  /** Có khi caller (Manager) muốn cho phép "Chọn làm bối cảnh làm việc". */
  onSetContext?: (semester: SemesterApiItem) => void;
}

export function SemestersTable({ semesters, currentContextId, onSetContext }: SemestersTableProps) {
  const [pending, setPending] = useState<SemesterApiItem | null>(null);
  const transition = useTransitionSemester();

  if (semesters.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có học kỳ nào khớp tìm kiếm.</p>;
  }

  const nextStatus = pending ? NEXT_STATUS[pending.status] : undefined;

  function handleConfirm(reason: string) {
    if (!pending || !nextStatus) return;
    transition.mutate({ id: pending.id, payload: { target_status: nextStatus, reason } });
    setPending(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mã học kỳ</TableHead>
              <TableHead>Tên học kỳ</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.map((semester) => {
              const next = NEXT_STATUS[semester.status];
              const isCurrentContext = onSetContext && semester.code === currentContextId;
              return (
                <TableRow key={semester.id}>
                  <TableCell className="pl-4 font-mono text-xs font-medium">
                    <span className="flex items-center gap-2">
                      {semester.code}
                      {isCurrentContext && (
                        <Badge variant="secondary" className="gap-1 font-sans font-normal normal-case">
                          <Check className="size-3" />
                          Đang chọn
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{semester.name}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(semester.start_date, "DD/MM/YYYY")} – {formatDate(semester.end_date, "DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={cn("size-1.5 rounded-full", SEMESTER_STATUS_DOT[semester.status])} aria-hidden />
                      {SEMESTER_STATUS_LABEL[semester.status]}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {next || onSetContext ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Hành động">
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-56">
                          {onSetContext && (
                            <>
                              <DropdownMenuItem
                                disabled={semester.code === currentContextId}
                                onClick={() => onSetContext(semester)}
                              >
                                <Pin />
                                Chọn làm bối cảnh làm việc
                              </DropdownMenuItem>
                              {next && <DropdownMenuSeparator />}
                            </>
                          )}
                          {next && (
                            <DropdownMenuItem onClick={() => setPending(semester)}>
                              {next === "ACTIVE" ? <CalendarCheck /> : <CalendarX2 />}
                              {next === "ACTIVE" ? "Mở học kỳ (ACTIVE)" : "Đóng học kỳ (CLOSED)"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={nextStatus === "ACTIVE" ? "Mở học kỳ" : "Đóng học kỳ"}
        description={`Chuyển "${pending?.name ?? ""}" từ ${pending ? SEMESTER_STATUS_LABEL[pending.status] : ""} sang ${nextStatus ? SEMESTER_STATUS_LABEL[nextStatus] : ""}. Lý do sẽ được ghi vào audit log.`}
        destructive={nextStatus === "CLOSED"}
        confirmLabel={nextStatus === "ACTIVE" ? "Mở học kỳ" : "Đóng học kỳ"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
