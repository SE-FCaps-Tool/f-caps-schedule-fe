"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, TriangleAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUpdateAccountStatus } from "@/hooks/admin/useAccounts";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import { seniorityLabel } from "@/lib/utils/masterDataLabels";
import { EditLecturerSeniorityDialog } from "./edit-lecturer-seniority-dialog";

export function LecturersTable({ lecturers }: { lecturers: LecturerApiItem[] }) {
  const [pending, setPending] = useState<LecturerApiItem | null>(null);
  const [editing, setEditing] = useState<LecturerApiItem | null>(null);
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
              <TableHead>Kinh nghiệm</TableHead>
              <TableHead>Xung đột</TableHead>
              <TableHead className="pr-4 text-right">Hoạt động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecturers.map((lecturer) => (
              <TableRow key={lecturer.id}>
                <TableCell className="pl-4 font-mono text-xs font-medium">{lecturer.lecturerCode}</TableCell>
                <TableCell className="font-medium">{lecturer.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{lecturer.email}</TableCell>
                <TableCell>
                  <span className="text-sm">{seniorityLabel(lecturer.seniorityLevel)}</span>
                </TableCell>
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
                              Dự án #{c.projectId} — {c.reason}
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
                  <div className="inline-flex items-center gap-2">
                    <Switch
                      checked={lecturer.accountStatus === "ACTIVE"}
                      onCheckedChange={() => setPending(lecturer)}
                      aria-label={`${lecturer.accountStatus === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"} ${lecturer.displayName}`}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`Hành động với ${lecturer.displayName}`}>
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(lecturer)}>
                          <Pencil />
                          Sửa kinh nghiệm
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.accountStatus === "ACTIVE" ? "Vô hiệu hóa giảng viên" : "Kích hoạt giảng viên"}
        description={`Áp dụng cho tài khoản ${pending?.displayName ?? ""} (${pending?.email ?? ""}) gắn với mã GV ${pending?.lecturerCode ?? ""}.`}
        destructive={pending?.accountStatus === "ACTIVE"}
        onConfirm={(reason) => {
          if (!pending) return;
          updateStatus.mutate({
            accountId: pending.accountId,
            payload: { status: pending.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE", reason },
          });
          setPending(null);
        }}
      />
      <EditLecturerSeniorityDialog
        key={editing?.id ?? "no-lecturer"}
        lecturer={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  );
}
