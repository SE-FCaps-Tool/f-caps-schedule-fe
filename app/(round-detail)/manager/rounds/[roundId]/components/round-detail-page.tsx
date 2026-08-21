"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoundDetail, useRegistrationSummary } from "@/hooks/manager/useRounds";
import { RoundDetailHeader } from "./round-detail-header";
import { RoundInfoSidebar } from "./round-info-sidebar";
import { RoundCalendarPanel } from "./round-calendar-panel";
import { RoundPeoplePanel } from "./round-people-panel";
import { CollapsibleAsidePanel } from "./collapsible-aside-panel";
import { ErrorBlock, LoadingBlock } from "./round-detail-shared";

/**
 * Toàn màn hình (route group `(round-detail)`, không có AppShell/sidebar — xem layout.tsx) để
 * Calendar ở giữa dùng tối đa không gian. Header dính (shrink-0), phần dưới tự cuộn.
 */
export function RoundDetailPage({ roundId }: { roundId: string }) {
  const { data: round, isLoading: roundLoading, isError: roundError } = useRoundDetail(roundId);
  const { data: registrationSummary } = useRegistrationSummary(roundId);
  const reduceMotion = useReducedMotion();
  const [peopleOpen, setPeopleOpen] = useState(true);

  if (roundLoading) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (roundError || !round) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="flex-1 p-6">
          <ErrorBlock label="Không tải được đợt đánh giá. Thử tải lại trang." />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-dvh flex-col overflow-hidden bg-background"
    >
      <RoundDetailHeader roundId={roundId} round={round} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <aside className="shrink-0 border-b border-border p-4 lg:h-full lg:w-[280px] lg:overflow-y-auto lg:border-r lg:border-b-0">
          <RoundInfoSidebar round={round} registrationSummary={registrationSummary} />
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:overflow-y-auto lg:p-6">
          <RoundCalendarPanel roundId={roundId} round={round} />
        </main>

        <CollapsibleAsidePanel title="Giảng viên & Nhóm" open={peopleOpen} onOpenChange={setPeopleOpen}>
          <RoundPeoplePanel roundId={roundId} round={round} onCollapse={() => setPeopleOpen(false)} />
        </CollapsibleAsidePanel>
      </div>
    </motion.div>
  );
}
