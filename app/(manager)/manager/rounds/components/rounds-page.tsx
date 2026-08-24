"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ChevronRight, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRounds } from "@/hooks/manager/useRounds";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { fetchRounds } from "@/lib/api/services/fetchRounds";

export function RoundsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = useState(1);
  const {
    data: roundsResult,
    isLoading,
    isError,
  } = useRounds(currentSemester?.id, { page, pageSize });

  function roundHref(roundId: string) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("semester") && currentSemesterId) {
      params.set("semester", currentSemesterId);
    }
    const query = params.toString();
    return `/manager/rounds/${roundId}${query ? `?${query}` : ""}`;
  }

  function openRound(roundId: string) {
    startNavigationProgress();
    router.push(roundHref(roundId));
  }

  function prefetchRound(roundId: string) {
    const href = roundHref(roundId);
    router.prefetch(href);
    void queryClient.prefetchQuery({
      queryKey: ["manager", "round", roundId] as const,
      queryFn: () => fetchRounds.getById(roundId),
      staleTime: Infinity,
    });
    void queryClient.prefetchQuery({
      queryKey: ["manager", "round", roundId, "registration-summary"] as const,
      queryFn: () => fetchRounds.registrationSummary(roundId),
      staleTime: Infinity,
    });
  }
  // Học kỳ CLOSED hiển thị mọi đợt ở trạng thái LOCKED (chỉ xem, không thao tác) — §8 doc
  const isLockedSemester = currentSemester?.status === "CLOSED";
  const { items: rounds, meta } = roundsResult
    ? normalizeListResponse(roundsResult, { page, pageSize })
    : { items: [] as NonNullable<typeof roundsResult>["data"], meta: null };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Các đợt đánh giá{" "}
            <span className="font-normal text-muted-foreground">
              — {currentSemesterId}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta ? `${meta.total} đợt trong học kỳ ${currentSemesterId}` : "…"}
          </p>
        </div>
        {isLockedSemester ? (
          <Button
            variant="outline"
            disabled
            title="Không thể tạo đợt trong học kỳ đã khóa"
            className="min-h-10"
          >
            <CalendarPlus />
            Tạo đợt đánh giá
          </Button>
        ) : (
          <Link
            href={
              currentSemesterId
                ? `/manager/rounds/new?semester=${currentSemesterId}`
                : "/manager/rounds/new"
            }
          >
            <Button title="Tạo đợt đánh giá mới" className="min-h-10">
              <CalendarPlus />
              Tạo đợt đánh giá
            </Button>
          </Link>
        )}
      </div>

      {isLockedSemester && (
        <p className="mt-4 text-sm text-muted-foreground">
          Học kỳ {currentSemesterId} đã khóa — mọi đợt đánh giá chỉ ở chế độ
          xem.
        </p>
      )}

      <div ref={containerRef} className="mt-6">
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
            Không tải được danh sách đợt đánh giá. Thử tải lại trang.
          </div>
        )}
        {roundsResult && (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Đợt</TableHead>
                    <TableHead>Loại đợt</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Khoảng ngày</TableHead>
                    <TableHead className="text-right">Thời lượng</TableHead>
                    <TableHead className="text-center">Reviewer</TableHead>
                    <TableHead>Hạn đăng ký chọn lịch</TableHead>
                    <TableHead className="pr-4">
                      <span className="sr-only">Mở</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rounds.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Học kỳ này chưa có đợt đánh giá nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {rounds.map((round) => {
                    const statusMeta = isLockedSemester
                      ? ROUND_STATUS_META.LOCKED
                      : ROUND_STATUS_META[round.status];
                    return (
                      <TableRow
                        key={round.id}
                        className="cursor-pointer"
                        onMouseEnter={() => prefetchRound(round.id)}
                        onFocus={() => prefetchRound(round.id)}
                        onClick={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest("a,button")
                          )
                            return;
                          openRound(round.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openRound(round.id);
                          }
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <TableCell className="pl-4 p-0">
                          <Link
                            href={roundHref(round.id)}
                            className="block max-w-xs truncate px-2 py-2 font-medium"
                          >
                            <span className="block truncate">
                              {round.name || ROUND_TYPE_LABEL[round.type]}
                            </span>
                            {round.timeframeId && (
                              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                                Timeframe #{round.timeframeId}
                              </span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ROUND_TYPE_LABEL[round.type]}
                        </TableCell>
                        <TableCell>
                          <StatusDot
                            tone={statusMeta.tone}
                            label={statusMeta.label}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                          {round.startDate && round.endDate
                            ? `${formatDate(round.startDate, "DD/MM")} – ${formatDate(round.endDate, "DD/MM/YYYY")}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {round.durationMinutes} phút
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {round.reviewerCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                          {round.registrationDeadline
                            ? formatDate(round.registrationDeadline)
                            : "—"}
                        </TableCell>
                        <TableCell className="pr-4">
                          <Link
                            href={roundHref(round.id)}
                            aria-label={`Mở ${round.name}`}
                          >
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {meta && <DataTablePagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
