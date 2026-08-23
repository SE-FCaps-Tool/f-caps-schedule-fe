"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Upload, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/admin/useAccounts";
import { AccountsTable, RoleFilterSelect } from "./accounts-table";
import { CreateAccountDialog } from "./create-account-dialog";
import type { UserRole } from "@/lib/types/roles";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { usePageState } from "@/hooks/shared/usePageState";

type AccountStatus = "ACTIVE" | "INACTIVE";

export function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL");
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = usePageState(search, roleFilter, statusFilter, pageSize);

  const filtered = useMemo(() => {
    if (!accounts) return [];
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (roleFilter !== "ALL" && a.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (q && !a.email.toLowerCase().includes(q) && !a.displayName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [accounts, search, roleFilter, statusFilter]);

  const { items: pageItems, meta } = normalizeListResponse(filtered, { page, pageSize });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tài khoản & phân quyền</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accounts ? (
              <>
                {accounts.length} tài khoản · {accounts.filter((a) => a.status === "ACTIVE").length} đang hoạt động
              </>
            ) : (
              "Đang tải..."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.info("Import CSV/Excel — chưa nối backend")}>
            <Upload />
            Import CSV
          </Button>
          <CreateAccountDialog />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc họ tên..."
            className="pl-9"
          />
        </div>
        <RoleFilterSelect value={roleFilter} onChange={setRoleFilter} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AccountStatus | "ALL")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Trạng thái">
              {(v: AccountStatus | "ALL") =>
                v === "ALL" ? "Tất cả trạng thái" : v === "ACTIVE" ? "Hoạt động" : "Đã khóa"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div ref={containerRef} className="mt-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách tài khoản. Thử tải lại trang.
          </div>
        )}

        {accounts && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Không có tài khoản khớp bộ lọc.</p>
        )}

        {accounts && filtered.length > 0 && (
          <>
            <AccountsTable accounts={pageItems} />
            <DataTablePagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
