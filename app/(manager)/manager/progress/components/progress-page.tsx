"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StatusDot } from "../../_shared/status-dot";
import { REVIEW_RESULT_META, DEFENSE_CONCLUSION_META, type ReviewResult, type DefenseConclusion } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useGroupProgress } from "@/hooks/manager/useReports";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { usePageState } from "@/hooks/shared/usePageState";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";

function ReviewCell({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-sm text-muted-foreground">—</span>;
  const meta = REVIEW_RESULT_META[outcome as ReviewResult];
  if (!meta) return <span className="text-sm text-muted-foreground">{outcome}</span>;
  return <StatusDot tone={meta.tone} label={meta.label} />;
}

function DefenseCell({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-sm text-muted-foreground">—</span>;
  const meta = DEFENSE_CONCLUSION_META[outcome as DefenseConclusion];
  if (!meta) return <span className="text-sm text-muted-foreground">{outcome}</span>;
  return <StatusDot tone={meta.tone} label={meta.label} />;
}

export function ProgressPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: groups, isLoading, isError } = useGroupProgress(currentSemester?.id);
  const searchParams = useSearchParams();
  // Cho phép deep-link từ trang Nhóm/Lịch đánh giá: /manager/progress?group=G001
  const [search, setSearch] = useState(searchParams.get("group") ?? "");
  const { containerRef, pageSize } = useAutoPageSize();

  const filtered = useMemo(() => {
    if (!groups) return [];
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.groupCode.toLowerCase().includes(q) || g.projectName.toLowerCase().includes(q));
  }, [groups, search]);

  const [page, setPage] = usePageState(search, pageSize);
  const { items: pageItems, meta } = normalizeListResponse(filtered, { page, pageSize });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tiến độ nhóm <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhóm đang ở bước nào trong quy trình đánh giá</p>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã nhóm hoặc đề tài..." className="pl-9" />
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
            Không tải được tiến độ nhóm. Thử tải lại trang.
          </div>
        )}
        {groups && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nhóm</TableHead>
                  <TableHead>Review 1</TableHead>
                  <TableHead>Review 2</TableHead>
                  <TableHead>Review 3</TableHead>
                  <TableHead className="pr-4">Tiếp theo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Chưa có nhóm nào khớp tìm kiếm.
                    </TableCell>
                  </TableRow>
                )}
                {pageItems.map((group) => (
                  <TableRow key={group.groupId}>
                    <TableCell className="pl-4">
                      <span className="font-mono text-xs font-medium">{group.groupCode}</span>
                      <span className="ml-2 max-w-40 truncate align-middle text-xs text-muted-foreground" title={group.projectName}>
                        {group.projectName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ReviewCell outcome={group.review1} />
                    </TableCell>
                    <TableCell>
                      <ReviewCell outcome={group.review2} />
                    </TableCell>
                    <TableCell>
                      <DefenseCell outcome={group.review3} />
                    </TableCell>
                    <TableCell className={cn("pr-4", group.groupStatus === "FAILED" ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {group.nextStep}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {groups && <DataTablePagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
