"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, Download, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useRoundDetail } from "@/hooks/manager/useRounds";
import { useExportCouncil } from "@/hooks/manager/useReports";
import { ErrorBlock, LoadingBlock } from "../../components/round-detail-shared";
import { RoundManualScheduleBoard } from "../../components/round-manual-schedule-board";

const NORMAL_MANUAL_EDIT_STATUSES = new Set([
  "DRAFT",
  "OPEN_REGISTRATION",
  "REGISTRATION_CLOSED",
  "SCHEDULING",
]);
const NON_PUBLISHABLE_ROUND_STATUSES = new Set([
  "ONGOING",
  "POSTPONED",
  "COMPLETED",
  "LOCKED",
  "CANCELLED",
]);
/**
 * Trạng thái chưa từng có phương án activate — export hội đồng chắc chắn rỗng.
 * BE cho xuất ngay khi version ACTIVE (chưa cần đợi PUBLISHED, manager-api.md §10.8).
 */
const COUNCIL_EXPORT_UNAVAILABLE_STATUSES = new Set([
  "DRAFT",
  "OPEN_REGISTRATION",
  "REGISTRATION_CLOSED",
  "SCHEDULING",
  "CANCELLED",
]);

export function RoundManualSchedulePage({ roundId }: { roundId: string }) {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId } = useSemesterContext();
  const { data: round, isLoading, isError } = useRoundDetail(roundId);
  const exportCouncil = useExportCouncil();

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (isError || !round) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex-1 p-6">
          <ErrorBlock label="Không tải được đợt đánh giá. Thử tải lại trang." />
        </div>
      </div>
    );
  }

  const statusMeta = ROUND_STATUS_META[round.status];
  const name = round.name || `${ROUND_TYPE_LABEL[round.type]} - ${currentSemesterId}`;
  const editingVersionedDraft = !NORMAL_MANUAL_EDIT_STATUSES.has(round.status);
  const cannotPublish = NON_PUBLISHABLE_ROUND_STATUSES.has(round.status);
  const canExportCouncil = !COUNCIL_EXPORT_UNAVAILABLE_STATUSES.has(round.status);

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-dvh flex-col overflow-hidden bg-background"
    >
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-2 md:px-6">
        <Link
          href={`/manager/rounds/${roundId}`}
          aria-label="Quay lại chi tiết round"
          title="Quay lại chi tiết round"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold tracking-tight">Xếp lịch</h1>
            <StatusDot tone={statusMeta.tone} label={statusMeta.label} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{name}</p>
        </div>

        {canExportCouncil && (
          <Button
            size="sm"
            variant="outline"
            disabled={exportCouncil.isPending}
            onClick={() => exportCouncil.mutate(Number(roundId))}
          >
            {exportCouncil.isPending ? <Loader2 className="animate-spin" /> : <Download />}
            Xuất hội đồng
          </Button>
        )}
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/manager/rounds/${roundId}`} />}>
          Xem đăng ký lịch
        </Button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
        {editingVersionedDraft && (
          <div
            role="status"
            className="mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"
          >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Bạn đang chỉnh bản nháp trong workspace này. Lịch đã công bố không thay đổi.
              {cannotPublish
                ? " Trạng thái round hiện tại chưa cho phép công bố bản nháp."
                : " Chạy thuật toán sẽ tạo version nháp; chỉ khi bấm “Công bố lịch” lịch công khai mới thay đổi."}
            </span>
          </div>
        )}

        <div className="min-h-[32rem]">
          <RoundManualScheduleBoard roundId={roundId} round={round} />
        </div>
      </main>
    </motion.div>
  );
}
