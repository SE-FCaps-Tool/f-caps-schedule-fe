"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronRight, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRounds } from "@/hooks/manager/useRounds";

export function RoundsPage() {
  const router = useRouter();
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: roundsResult, isLoading, isError } = useRounds(currentSemester?.id);

  function openRound(roundId: string) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("semester") && currentSemesterId) {
      params.set("semester", currentSemesterId);
    }
    const query = params.toString();
    router.push(`/manager/rounds/${roundId}${query ? `?${query}` : ""}`);
  }
  // Học kỳ CLOSED hiển thị mọi đợt ở trạng thái LOCKED (chỉ xem, không thao tác) — §8 doc
  const isLockedSemester = currentSemester?.status === "CLOSED";
  const rounds = roundsResult?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Các đợt đánh giá <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {roundsResult
              ? `${roundsResult.meta?.total ?? roundsResult.data?.length ?? 0} đợt trong học kỳ ${currentSemesterId}`
              : "…"}
          </p>
        </div>
        <Link href="/manager/rounds/new" aria-disabled={isLockedSemester}>
          <Button size="sm" disabled={isLockedSemester}>
            <CalendarPlus />
            Tạo đợt đánh giá
          </Button>
        </Link>
      </div>

      {isLockedSemester && (
        <p className="mt-4 text-sm text-muted-foreground">
          Học kỳ {currentSemesterId} đã khóa — mọi đợt đánh giá chỉ ở chế độ xem.
        </p>
      )}

      <div className="mt-6">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Đợt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thời lượng</TableHead>
                  <TableHead className="text-center">Reviewer</TableHead>
                  <TableHead>Hạn đăng ký</TableHead>
                  <TableHead className="pr-4">
                    <span className="sr-only">Mở</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Học kỳ này chưa có đợt đánh giá nào.
                    </TableCell>
                  </TableRow>
                )}
                {rounds.map((round) => {
                  const statusMeta = isLockedSemester ? ROUND_STATUS_META.LOCKED : ROUND_STATUS_META[round.status];
                  return (
                    <TableRow
                      key={round.id}
                      className="cursor-pointer"
                      onClick={(event) => {
                        if (event.target instanceof Element && event.target.closest("a,button")) return;
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
                        <Link href={`/manager/rounds/${round.id}`} className="block max-w-xs truncate px-2 py-2 font-medium">
                          {round.name || ROUND_TYPE_LABEL[round.type]}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={statusMeta.tone} label={statusMeta.label} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{round.durationMinutes} phút</TableCell>
                      <TableCell className="text-center tabular-nums">{round.reviewerCount}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {round.registrationDeadline ? formatDate(round.registrationDeadline) : "—"}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Link href={`/manager/rounds/${round.id}`} aria-label={`Mở ${round.name}`}>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
