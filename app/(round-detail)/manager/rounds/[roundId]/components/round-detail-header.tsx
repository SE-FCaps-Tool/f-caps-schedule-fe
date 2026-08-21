"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useOpenRoundRegistration, useCloseRoundRegistration } from "@/hooks/manager/useRounds";
import { usePublishReadiness, usePublishRound } from "@/hooks/manager/useScheduling";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import { FUTURE_PHASE_LABEL, notImplemented } from "./round-detail-shared";

function PublishDialog({
  open,
  onOpenChange,
  roundId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
}) {
  const { data: readiness, isLoading } = usePublishReadiness(open ? roundId : null);
  const publishRound = usePublishRound();

  function handlePublish() {
    if (readiness?.versionId == null) return;
    publishRound.mutate({ roundId, versionId: readiness.versionId }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Công bố lịch</DialogTitle>
          <DialogDescription>
            Sau khi công bố, lịch sẽ hiển thị cho giảng viên và sinh viên; mọi thay đổi sau đó phải qua các thao tác
            post-publish (đổi phòng, thay reviewer, hoãn buổi).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {readiness && readiness.ready && (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              Đủ điều kiện công bố lịch.
            </p>
          )}
          {readiness && !readiness.ready && (
            <ul className="space-y-1.5 text-sm">
              {readiness.blockers.map((blocker) => (
                <li key={blocker.code} className="flex items-center justify-between gap-3">
                  <span className="text-destructive">{blocker.message}</span>
                  <StatusDot tone="red" label={blocker.code} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!readiness?.ready || readiness.versionId == null || publishRound.isPending}
            onClick={handlePublish}
          >
            {publishRound.isPending ? "Đang công bố..." : "Xác nhận công bố"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Header xuyên suốt phía trên 3 cột — tên round, trạng thái, hành động chính theo status. */
export function RoundDetailHeader({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const [publishOpen, setPublishOpen] = useState(false);
  const { currentSemesterId } = useSemesterContext();
  const openRegistration = useOpenRoundRegistration();
  const closeRegistration = useCloseRoundRegistration();

  const statusMeta = ROUND_STATUS_META[round.status];
  const name = round.name || `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
  const futurePhaseLabel = FUTURE_PHASE_LABEL[round.status];
  const backHref = currentSemesterId ? `/manager/rounds?semester=${currentSemesterId}` : "/manager/rounds";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
      <Link
        href={backHref}
        aria-label="Các đợt đánh giá"
        title="Các đợt đánh giá"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>

      <div className="min-w-0 flex-1 flex items-center gap-2.5">
        <h1 className="truncate text-base font-semibold tracking-tight">{name}</h1>
        <StatusDot tone={statusMeta.tone} label={statusMeta.label} className="shrink-0" />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {round.status === "DRAFT" && (
          <Button size="sm" disabled={openRegistration.isPending} onClick={() => openRegistration.mutate(roundId)}>
            Mở đăng ký
          </Button>
        )}
        {round.status === "OPEN_REGISTRATION" && (
          <Button size="sm" disabled={closeRegistration.isPending} onClick={() => closeRegistration.mutate(roundId)}>
            Đóng đăng ký
          </Button>
        )}
        {round.status === "SCHEDULED" && (
          <Button size="sm" onClick={() => setPublishOpen(true)}>
            Công bố lịch
          </Button>
        )}
        {futurePhaseLabel && (
          <Button size="sm" variant="outline" onClick={() => notImplemented(futurePhaseLabel)}>
            {futurePhaseLabel}
          </Button>
        )}
      </div>

      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} roundId={roundId} />
    </header>
  );
}
