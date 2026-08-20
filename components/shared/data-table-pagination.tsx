"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { totalPages } from "@/lib/api/pagination";
import type { ListMeta } from "@/types/api";

interface DataTablePaginationProps {
  meta: ListMeta;
  onPageChange: (page: number) => void;
}

/** Thanh phân trang chung cho các bảng manager/admin — dùng với lib/api/pagination.ts normalizeListResponse(). */
export function DataTablePagination({ meta, onPageChange }: DataTablePaginationProps) {
  const pages = totalPages(meta);
  if (meta.total === 0) return null;

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.total, meta.page * meta.pageSize);

  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Hiển thị {start}–{end} / {meta.total}
      </p>
      {pages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Trước"
                aria-disabled={meta.page <= 1}
                className={meta.page <= 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (meta.page > 1) onPageChange(meta.page - 1);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground">
                Trang {meta.page}/{pages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Sau"
                aria-disabled={meta.page >= pages}
                className={meta.page >= pages ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (meta.page < pages) onPageChange(meta.page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
