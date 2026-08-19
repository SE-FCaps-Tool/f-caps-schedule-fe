"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronRight, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/formatDate";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRounds, useCreateRound } from "@/hooks/manager/useRounds";
import type { RoundCreatePayload, RoundType } from "@/lib/api/services/fetchRounds";

const ROUND_TYPES: RoundType[] = ["REVIEW_1", "REVIEW_2", "DEFENSE_1_1", "DEFENSE_1_2", "DEFENSE_2"];

function CreateRoundDialog({
  open,
  onOpenChange,
  semesterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const createRound = useCreateRound();
  const [type, setType] = useState<RoundType>("REVIEW_1");
  const [reviewerCount, setReviewerCount] = useState("2");
  const [sessionDuration, setSessionDuration] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function reset() {
    setType("REVIEW_1");
    setReviewerCount("2");
    setSessionDuration("30");
    setStartDate("");
    setEndDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!semesterId || !startDate || !endDate) return;
    const payload: RoundCreatePayload = {
      semester_id: semesterId,
      type,
      reviewer_count: Number(reviewerCount),
      session_duration_minutes: Number(sessionDuration),
      start_date: startDate,
      end_date: endDate,
    };
    createRound.mutate(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo đợt đánh giá</DialogTitle>
            <DialogDescription>Đợt mới sẽ ở trạng thái Nháp cho tới khi mở đăng ký.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Loại đợt</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as RoundType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: RoundType) => ROUND_TYPE_LABEL[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROUND_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ROUND_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Số reviewer / buổi</Label>
                <Input
                  type="number"
                  min={1}
                  value={reviewerCount}
                  onChange={(e) => setReviewerCount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thời lượng (phút)</Label>
                <Input
                  type="number"
                  min={5}
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createRound.isPending || !semesterId}>
              {createRound.isPending ? "Đang tạo..." : "Tạo đợt đánh giá"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoundsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: rounds, isLoading, isError } = useRounds(currentSemester?.id);
  const [createOpen, setCreateOpen] = useState(false);
  // Học kỳ CLOSED hiển thị mọi đợt ở trạng thái LOCKED (chỉ xem, không thao tác) — §8 doc
  const isLockedSemester = currentSemester?.status === "CLOSED";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Các đợt đánh giá <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rounds ? `${rounds.length} đợt trong học kỳ ${currentSemesterId}` : "…"}
          </p>
        </div>
        <Button size="sm" disabled={isLockedSemester} onClick={() => setCreateOpen(true)}>
          <CalendarPlus />
          Tạo đợt đánh giá
        </Button>
        <CreateRoundDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />
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
        {rounds && (
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
                  const name = `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
                  return (
                    <TableRow key={round.id} className="cursor-pointer">
                      <TableCell className="pl-4 p-0">
                        <Link href={`/manager/rounds/${round.id}`} className="block max-w-xs truncate px-2 py-2 font-medium">
                          {name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={statusMeta.tone} label={statusMeta.label} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{round.session_duration_minutes} phút</TableCell>
                      <TableCell className="text-center tabular-nums">{round.reviewer_count}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {round.registration_deadline ? formatDate(round.registration_deadline) : "—"}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Link href={`/manager/rounds/${round.id}`} aria-label={`Mở ${name}`}>
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
