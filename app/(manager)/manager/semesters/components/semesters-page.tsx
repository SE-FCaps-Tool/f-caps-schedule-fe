"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SemestersTable } from "@/components/semesters/semesters-table";
import { AddSemesterDialog } from "@/components/semesters/add-semester-dialog";
import { useSemesters } from "@/hooks/useSemesters";
import { SEMESTER_STATUS_LABEL } from "@/components/semesters/status";
import type { SemesterApiItem, SemesterStatus } from "@/lib/api/services/fetchSemesters";
import { useSemesterContext } from "../../_shared/semester-context";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { usePageState } from "@/hooks/shared/usePageState";

export function SemestersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SemesterStatus | "ALL">("ALL");
  const { data: semesters, isLoading, isError } = useSemesters({
    status: status === "ALL" ? undefined : status,
  });
  const { currentSemesterId, setCurrentSemesterId } = useSemesterContext();
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = usePageState(search, status, pageSize);

  const filtered = useMemo(() => {
    if (!semesters) return [];
    const q = search.trim().toLowerCase();
    if (!q) return semesters;
    return semesters.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [semesters, search]);

  const { items: pageItems, meta } = normalizeListResponse(filtered, { page, pageSize });

  function handleSetContext(semester: SemesterApiItem) {
    setCurrentSemesterId(semester.code);
    toast.success(`Đã chọn ${semester.code} làm bối cảnh làm việc`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Học kỳ</h1>
          <p className="mt-1 text-sm text-muted-foreground">{semesters ? `${meta.total} học kỳ` : "…"}</p>
        </div>
        <AddSemesterDialog />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên học kỳ..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v as SemesterStatus | "ALL")}>
          <SelectTrigger className="w-40">
            <SelectValue>{(v: string) => (v === "ALL" ? "Mọi trạng thái" : SEMESTER_STATUS_LABEL[v as SemesterStatus])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            <SelectItem value="ACTIVE">{SEMESTER_STATUS_LABEL.ACTIVE}</SelectItem>
            <SelectItem value="CLOSED">{SEMESTER_STATUS_LABEL.CLOSED}</SelectItem>
          </SelectContent>
        </Select>
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
            Không tải được danh sách học kỳ. Thử tải lại trang.
          </div>
        )}
        {semesters && (
          <SemestersTable semesters={pageItems} currentContextId={currentSemesterId} onSetContext={handleSetContext} />
        )}
        {semesters && <DataTablePagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
