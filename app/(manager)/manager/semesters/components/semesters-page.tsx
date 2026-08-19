"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SemestersTable } from "@/components/semesters/semesters-table";
import { AddSemesterDialog } from "@/components/semesters/add-semester-dialog";
import { useSemesters } from "@/hooks/useSemesters";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";
import { useSemesterContext } from "../../_shared/semester-context";

export function SemestersPage() {
  const { data: semesters, isLoading, isError } = useSemesters();
  const { currentSemesterId, setCurrentSemesterId } = useSemesterContext();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!semesters) return [];
    const q = search.trim().toLowerCase();
    if (!q) return semesters;
    return semesters.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [semesters, search]);

  function handleSetContext(semester: SemesterApiItem) {
    setCurrentSemesterId(semester.code);
    toast.success(`Đã chọn ${semester.code} làm bối cảnh làm việc`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Học kỳ</h1>
          <p className="mt-1 text-sm text-muted-foreground">{semesters ? `${semesters.length} học kỳ` : "…"}</p>
        </div>
        <AddSemesterDialog />
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên học kỳ..." className="pl-9" />
      </div>

      <div className="mt-4">
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
          <SemestersTable semesters={filtered} currentContextId={currentSemesterId} onSetContext={handleSetContext} />
        )}
      </div>
    </div>
  );
}
