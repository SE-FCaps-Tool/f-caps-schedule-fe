"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdateAccountStatus } from "@/hooks/admin/useAccounts";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";

export function LecturersTable({ lecturers }: { lecturers: LecturerApiItem[] }) {
  const [pending, setPending] = useState<LecturerApiItem | null>(null);
  const updateStatus = useUpdateAccountStatus();

  if (lecturers.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Không có giảng viên khớp tìm kiếm.</p>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mã GV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Xung đột</TableHead>
              <TableHead className="pr-4 text-right">Hoạt động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecturers.map((lecturer) => (
              <TableRow key={lecturer.id}>
                <TableCell className="pl-4 font-mono text-xs font-medium">{lecturer.lecturer_code}</TableCell>
                <TableCell className="font-medium">{lecturer.display_name}</TableCell>
                <TableCell className="text-muted-foreground">{lecturer.email}</TableCell>
                <TableCell>
                  {lecturer.conflicts.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                            <TriangleAlert className="size-3.5" />
                            {lecturer.conflicts.length}
                          </span>
                        }
                      />
                      <TooltipContent>
                        <ul className="space-y-0.5">
                          {lecturer.conflicts.map((c, i) => (
                            <li key={i}>
                              Dự án #{c.project_id} — {c.reason}
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Switch
                    checked={lecturer.account_status === "ACTIVE"}
                    onCheckedChange={() => setPending(lecturer)}
                    aria-label={`${lecturer.account_status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"} ${lecturer.display_name}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.account_status === "ACTIVE" ? "Vô hiệu hóa giảng viên" : "Kích hoạt giảng viên"}
        description={`Áp dụng cho tài khoản ${pending?.display_name ?? ""} (${pending?.email ?? ""}) gắn với mã GV ${pending?.lecturer_code ?? ""}.`}
        destructive={pending?.account_status === "ACTIVE"}
        onConfirm={(reason) => {
          if (!pending) return;
          updateStatus.mutate({
            accountId: pending.account_id,
            payload: { status: pending.account_status === "ACTIVE" ? "INACTIVE" : "ACTIVE", reason },
          });
          setPending(null);
        }}
      />
    </>
  );
}
