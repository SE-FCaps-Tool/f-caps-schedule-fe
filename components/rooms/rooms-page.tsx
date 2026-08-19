"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRooms } from "@/hooks/useRooms";
import { RoomsGrid } from "./rooms-grid";
import { AddRoomDialog } from "./add-room-dialog";

/**
 * Dùng chung cho Admin (`/admin/master-data/rooms`) và Manager (`/manager/rooms`).
 * `backHref`/`backLabel` chỉ hiện breadcrumb khi được truyền — Manager không có hub "Cấu hình"
 * tương ứng nên bỏ qua.
 */
export function RoomsPage({ backHref, backLabel }: { backHref?: string; backLabel?: string }) {
  const { data: rooms, isLoading, isError } = useRooms();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!rooms) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [rooms, search]);

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
          <h1 className="text-2xl font-semibold tracking-tight">Phòng</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rooms ? `${rooms.length} phòng` : "…"}</p>
        </div>
        <AddRoomDialog />
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên phòng..." className="pl-9" />
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
            Không tải được danh sách phòng. Thử tải lại trang.
          </div>
        )}
        {rooms && <RoomsGrid rooms={filtered} />}
      </div>
    </div>
  );
}
