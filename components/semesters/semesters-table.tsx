"use client";

import { useState } from "react";
import { CalendarX2, Check, ClipboardCheck, FolderKanban, MessageSquareText, MoreHorizontal, PencilLine, Pin, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetCurrentSemester, useTransitionSemester } from "@/hooks/useSemesters";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { EditSemesterDialog } from "./edit-semester-dialog";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";
import { SEMESTER_STATUS_DOT, SEMESTER_STATUS_LABEL } from "./status";

interface SemestersTableProps {
  semesters: SemesterApiItem[];
  /** Mã học kỳ đang được chọn làm bối cảnh làm việc (Manager). Bỏ qua nếu không dùng tính năng này. */
  currentContextId?: string | null;
  /** Có khi caller (Manager) muốn cho phép "Chọn làm bối cảnh làm việc". */
  onSetContext?: (semester: SemesterApiItem) => void;
}

function StatChip({ icon: Icon, value, label }: { icon: typeof FolderKanban; value: number; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Icon className="size-3.5" aria-hidden />
            {value}
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function SemestersTable({ semesters, currentContextId, onSetContext }: SemestersTableProps) {
  const [closingTarget, setClosingTarget] = useState<SemesterApiItem | null>(null);
  const [editingTarget, setEditingTarget] = useState<SemesterApiItem | null>(null);
  const transition = useTransitionSemester();
  const setCurrent = useSetCurrentSemester();

  if (semesters.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có học kỳ nào khớp tìm kiếm.</p>;
  }

  function handleConfirmClose(reason: string) {
    if (!closingTarget) return;
    transition.mutate({ id: closingTarget.id, payload: { targetStatus: "CLOSED", reason } });
    setClosingTarget(null);
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
              <TableHead>Số liệu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.map((semester) => {
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
                  <TableCell>
                    <span className="flex items-center gap-1.5 font-medium">
                      {semester.name}
                      {semester.note && (
                        <Tooltip>
                          <TooltipTrigger
                            render={<MessageSquareText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                          />
                          <TooltipContent>{semester.note}</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{semester.academicYear}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(semester.startDate, "DD/MM/YYYY")} – {formatDate(semester.endDate, "DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <StatChip icon={FolderKanban} value={semester.projectCount} label="Đề tài" />
                      <StatChip icon={Users2} value={semester.groupCount} label="Nhóm" />
                      <StatChip icon={ClipboardCheck} value={semester.roundCount} label="Đợt đánh giá" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={cn("size-1.5 rounded-full", SEMESTER_STATUS_DOT[semester.status])} aria-hidden />
                      {SEMESTER_STATUS_LABEL[semester.status]}
                    </span>
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
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setEditingTarget(semester)}>
                          <PencilLine />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {onSetContext && (
                          <DropdownMenuItem
                            disabled={semester.code === currentContextId}
                            onClick={() => onSetContext(semester)}
                          >
                            <Pin />
                            Chọn làm bối cảnh làm việc
                          </DropdownMenuItem>
                        )}
                        {(semester.status === "ACTIVE" || semester.status === "CLOSED") && <DropdownMenuSeparator />}
                        {semester.status === "CLOSED" && (
                          <DropdownMenuItem disabled={setCurrent.isPending} onClick={() => setCurrent.mutate(semester.id)}>
                            <Check />
                            Đặt làm học kỳ hiện tại
                          </DropdownMenuItem>
                        )}
                        {semester.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => setClosingTarget(semester)}>
                            <CalendarX2 />
                            Đóng học kỳ
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

      <ReasonDialog
        open={closingTarget !== null}
        onOpenChange={(open) => !open && setClosingTarget(null)}
        title="Đóng học kỳ"
        description={`Chuyển "${closingTarget?.name ?? ""}" từ Đang hoạt động sang Đã đóng. Lý do sẽ được ghi vào audit log.`}
        destructive
        confirmLabel="Đóng học kỳ"
        onConfirm={handleConfirmClose}
      />

      <EditSemesterDialog semester={editingTarget} onOpenChange={(open) => !open && setEditingTarget(null)} />
    </>
  );
}
