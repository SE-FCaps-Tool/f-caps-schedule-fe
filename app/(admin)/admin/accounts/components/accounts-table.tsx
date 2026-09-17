"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldMinus, ShieldPlus, UserX, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignRole, useRemoveRole, useUpdateAccountStatus } from "@/hooks/admin/useAccounts";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import type { AccountApiItem } from "@/lib/api/services/fetchAccounts";
import { RoleAssignmentDialog } from "./role-assignment-dialog";

const ALL_ROLES: UserRole[] = [ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT];

interface PendingRoleRemoval {
  account: AccountApiItem;
  role: UserRole;
}

export function AccountsTable({ accounts }: { accounts: AccountApiItem[] }) {
  const [pendingToggle, setPendingToggle] = useState<AccountApiItem | null>(null);
  const [pending, setPending] = useState<PendingRoleRemoval | null>(null);
  const [pendingRole, setPendingRole] = useState<{ account: AccountApiItem; role: UserRole } | null>(null);
  const updateStatus = useUpdateAccountStatus();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  function closeDialog() {
    setPending(null);
  }

  function handleConfirm(reason: string) {
    if (!pending) return;
    removeRoleMutation.mutate({ accountId: pending.account.id, role: pending.role, reason });
    closeDialog();
  }

  function handleToggleConfirm() {
    if (!pendingToggle) return;
    const nextStatus = pendingToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({
      accountId: pendingToggle.id,
      payload: {
        status: nextStatus,
        reason: `${nextStatus === "INACTIVE" ? "Khóa" : "Mở khóa"} tài khoản qua thao tác nhanh`,
      },
    });
    setPendingToggle(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Email</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="pl-4 font-mono text-xs">{account.email}</TableCell>
                <TableCell className="font-medium">
                  {account.displayName}
                  {account.lecturerCode && (
                    <span className="block font-mono text-xs font-normal text-muted-foreground">
                      {account.lecturerCode}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {account.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {ROLE_LABEL_VI[role]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        account.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground/40"
                      )}
                      aria-hidden
                    />
                    {account.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(account.createdAt, "DD/MM/YYYY")}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant={account.status === "ACTIVE" ? "destructive" : "outline"}
                      size="icon-sm"
                      aria-label={account.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      title={account.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      onClick={() => setPendingToggle(account)}
                    >
                      {account.status === "ACTIVE" ? <UserX /> : <UserCheck />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Hành động">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Vai trò</DropdownMenuLabel>
                          {ALL_ROLES.filter((role) => !account.roles.includes(role)).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => setPendingRole({ account, role })}
                            >
                              <ShieldPlus />
                              Gán {ROLE_LABEL_VI[role]}
                            </DropdownMenuItem>
                          ))}
                          {account.roles.map((role) => (
                            <DropdownMenuItem
                              key={`remove-${role}`}
                              variant="destructive"
                              onClick={() => setPending({ account, role })}
                            >
                              <ShieldMinus />
                              Gỡ {ROLE_LABEL_VI[role]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pendingToggle !== null} onOpenChange={(open) => !open && setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Áp dụng cho {pendingToggle?.displayName} ({pendingToggle?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingToggle?.status === "ACTIVE" ? "destructive" : "default"}
              onClick={handleToggleConfirm}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title={`Gỡ vai trò ${pending?.role ? ROLE_LABEL_VI[pending.role] : ""}`}
        description={`Áp dụng cho ${pending?.account.displayName ?? ""} (${pending?.account.email ?? ""}). Lý do sẽ được ghi vào audit log.`}
        destructive
        confirmLabel="Xác nhận"
        onConfirm={handleConfirm}
      />
      <RoleAssignmentDialog
        key={pendingRole ? `${pendingRole.account.id}-${pendingRole.role}` : "closed"}
        account={pendingRole?.account ?? null}
        role={pendingRole?.role ?? null}
        open={pendingRole !== null}
        onOpenChange={(open) => !open && setPendingRole(null)}
        onConfirm={(payload) => {
          if (!pendingRole) return;
          assignRoleMutation.mutate({ accountId: pendingRole.account.id, payload });
          setPendingRole(null);
        }}
      />
    </>
  );
}

export function RoleFilterSelect({ value, onChange }: { value: UserRole | "ALL"; onChange: (v: UserRole | "ALL") => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as UserRole | "ALL")}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Vai trò">
          {(v: UserRole | "ALL") => (v === "ALL" ? "Tất cả vai trò" : ROLE_LABEL_VI[v])}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Tất cả vai trò</SelectItem>
        {ALL_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABEL_VI[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
