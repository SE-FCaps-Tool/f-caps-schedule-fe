"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldMinus, ShieldPlus, UserX, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignRole, useRemoveRole, useUpdateAccountStatus } from "@/hooks/admin/useAccounts";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import type { AccountApiItem } from "@/lib/api/services/fetchAccounts";

const ALL_ROLES: UserRole[] = [ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT];

interface PendingAction {
  account: AccountApiItem;
  kind: "toggle-status" | "remove-role" | "assign-role";
  role?: UserRole;
}

export function AccountsTable({ accounts }: { accounts: AccountApiItem[] }) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const updateStatus = useUpdateAccountStatus();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  function closeDialog() {
    setPending(null);
  }

  function handleConfirm(reason: string) {
    if (!pending) return;
    const { account, kind, role } = pending;

    if (kind === "toggle-status") {
      updateStatus.mutate({
        accountId: account.id,
        payload: { status: account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", reason },
      });
    } else if (kind === "remove-role" && role) {
      removeRoleMutation.mutate({ accountId: account.id, role, reason });
    } else if (kind === "assign-role" && role) {
      assignRoleMutation.mutate({ accountId: account.id, payload: { role, reason } });
    }
    closeDialog();
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
                <TableCell className="font-medium">{account.displayName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABEL_VI[account.role]}</Badge>
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
                        {ALL_ROLES.filter((r) => r !== account.role).map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => setPending({ account, kind: "assign-role", role })}
                          >
                            <ShieldPlus />
                            Gán {ROLE_LABEL_VI[role]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPending({ account, kind: "remove-role", role: account.role })}
                        >
                          <ShieldMinus />
                          Gỡ {ROLE_LABEL_VI[account.role]}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant={account.status === "ACTIVE" ? "destructive" : "default"}
                        onClick={() => setPending({ account, kind: "toggle-status" })}
                      >
                        {account.status === "ACTIVE" ? <UserX /> : <UserCheck />}
                        {account.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title={
          pending?.kind === "toggle-status"
            ? pending.account.status === "ACTIVE"
              ? "Khóa tài khoản"
              : "Mở khóa tài khoản"
            : pending?.kind === "remove-role"
              ? `Gỡ vai trò ${pending.role ? ROLE_LABEL_VI[pending.role] : ""}`
              : `Gán vai trò ${pending?.role ? ROLE_LABEL_VI[pending.role] : ""}`
        }
        description={`Áp dụng cho ${pending?.account.displayName ?? ""} (${pending?.account.email ?? ""}). Lý do sẽ được ghi vào audit log.`}
        destructive={pending?.kind === "remove-role" || (pending?.kind === "toggle-status" && pending.account.status === "ACTIVE")}
        confirmLabel={pending?.kind === "assign-role" ? "Gán vai trò" : "Xác nhận"}
        onConfirm={handleConfirm}
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
