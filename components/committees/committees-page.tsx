"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Search, Trash2, UsersRound, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBulkDeleteCommittees, useCommittees } from "@/hooks/useCommittees";
import { CommitteesGrid } from "./committees-grid";
import { CommitteeCreateDialog } from "./committee-create-dialog";

/**
 * Dùng chung cho Admin (`/admin/master-data/committees`) và Manager (`/manager/committees`).
 * Committee là danh mục nháp — CRUD tự do, không phải bảng councils (hội đồng chấm điểm thật).
 */
export function CommitteesPage({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
}) {
  const { data: committees, isLoading, isError } = useCommittees();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkDelete = useBulkDeleteCommittees();

  const filtered = useMemo(() => {
    if (!committees) return [];
    const q = search.trim().toLowerCase();
    if (!q) return committees;
    return committees.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.members.some((m) => (m.displayName ?? "").toLowerCase().includes(q))
    );
  }, [committees, search]);

  function handleBulkDelete() {
    bulkDelete.mutate([...selectedIds], { onSuccess: () => setSelectedIds(new Set()) });
  }

  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {backLabel ?? "Quay lại"}
        </Link>
      )}

      <div className={backHref ? "mt-3 flex flex-wrap items-start justify-between gap-4" : "flex flex-wrap items-start justify-between gap-4"}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Hội đồng</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Danh mục nháp
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Chuẩn bị sẵn nhóm giảng viên để gắn vào Round khi xếp lịch đánh giá.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="size-3.5 text-primary" aria-hidden />
              {committees ? `${committees.length} hội đồng` : "Đang tải danh sách"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Sẵn sàng sử dụng
            </span>
          </div>
        </div>
        <CommitteeCreateDialog />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <p className="shrink-0 text-sm font-semibold">Danh sách hội đồng</p>
          <div className="relative min-w-48 max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã hoặc giảng viên..."
              className="h-9 bg-card pl-9"
            />
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1">
            <span className="px-1 text-sm text-muted-foreground">Đã chọn {selectedIds.size}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Bỏ chọn
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
            >
              <Trash2 />
              {bulkDelete.isPending ? "Đang xoá..." : `Xoá ${selectedIds.size}`}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách hội đồng. Thử tải lại trang.
          </div>
        )}
        {committees && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <ClipboardList className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">
              {committees.length === 0 ? "Chưa có hội đồng nào" : "Không tìm thấy hội đồng phù hợp"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {committees.length === 0
                ? "Tạo hội đồng để dùng làm nhóm giảng viên có sẵn khi thêm vào Round sau này."
                : "Thử từ khoá khác hoặc xoá bộ lọc tìm kiếm."}
            </p>
          </div>
        )}
        {committees && filtered.length > 0 && (
          <CommitteesGrid
            committees={filtered}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
          />
        )}
      </div>
    </div>
  );
}
