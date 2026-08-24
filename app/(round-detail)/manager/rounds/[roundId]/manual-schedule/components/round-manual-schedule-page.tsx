"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useRoundDetail } from "@/hooks/manager/useRounds";
import { ErrorBlock, LoadingBlock } from "../../components/round-detail-shared";
import { RoundManualScheduleBoard } from "../../components/round-manual-schedule-board";

export function RoundManualSchedulePage({ roundId }: { roundId: string }) {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId } = useSemesterContext();
  const { data: round, isLoading, isError } = useRoundDetail(roundId);

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

        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/manager/rounds/${roundId}`} />}>
          Xem đăng ký lịch
        </Button>
      </header>

      <main className="min-h-0 flex-1 p-4 lg:p-5">
        <RoundManualScheduleBoard roundId={roundId} round={round} />
      </main>
    </motion.div>
  );
}
