"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLecturersPage } from "@/hooks/useLecturers";
import { LecturersTable } from "./lecturers-table";
import { AddLecturerDialog } from "./add-lecturer-dialog";
import { ImportLecturersDialog } from "./import-lecturers-dialog";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { usePageState } from "@/hooks/shared/usePageState";

/**
 * Dùng chung cho Admin (`/admin/master-data/lecturers`) và Manager (`/manager/lecturers`).
 * `backHref`/`backLabel` trỏ về hub "Cấu hình" tương ứng của từng khu vực.
 */
export function LecturersPage({ backHref, backLabel }: { backHref?: string; backLabel?: string }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = usePageState(debouncedSearch, pageSize);

  const { data: lecturersResult, isLoading, isError } = useLecturersPage({
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });

  const { items: pageItems, meta } = lecturersResult
    ? normalizeListResponse(lecturersResult, { page, pageSize })
    : { items: [], meta: null };

  return (
    <div>
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          {backLabel ?? "Quay lại"}
        </Link>
      )}

      <div className={cn("flex flex-wrap items-start justify-between gap-4", backHref && "mt-2")}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giảng viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta ? `${meta.total} giảng viên` : "…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportLecturersDialog />
          <AddLecturerDialog />
        </div>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã GV..." className="pl-9" />
      </div>

      <div ref={containerRef} className="mt-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách giảng viên. Thử tải lại trang.
          </div>
        )}
        {meta && <LecturersTable lecturers={pageItems} />}
        {meta && <DataTablePagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
