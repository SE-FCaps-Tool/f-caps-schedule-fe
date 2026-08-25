"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  Download,
  Loader2,
  Send,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import {
  ROUND_STATUS_META,
  ROUND_TYPE_LABEL,
} from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import {
  useOpenRoundRegistration,
  useCloseRoundRegistration,
  useEligibleProjects,
  useRoundGroups,
} from "@/hooks/manager/useRounds";
import {
  usePublishReadiness,
  usePublishRound,
} from "@/hooks/manager/useScheduling";
import { useExportCouncil } from "@/hooks/manager/useReports";
import type {
  RegistrationSummary,
  RoundDetail,
  RoundStatus,
} from "@/lib/api/services/fetchRounds";
import { FUTURE_PHASE_LABEL, notImplemented } from "./round-detail-shared";
import { RoundLecturersPanel } from "./round-lecturers-panel";
import { RoundGroupsPanel } from "./round-groups-panel";

type PeoplePanel = "lecturers" | "groups";

/**
 * Trạng thái chưa từng có phương án activate — export hội đồng chắc chắn rỗng.
 * BE cho xuất ngay khi version ACTIVE (chưa cần đợi PUBLISHED, manager-api.md §10.8).
 */
const COUNCIL_EXPORT_UNAVAILABLE_STATUSES = new Set<RoundStatus>([
  "DRAFT",
  "OPEN_REGISTRATION",
  "REGISTRATION_CLOSED",
  "SCHEDULING",
  "CANCELLED",
]);

function PublishDialog({
  open,
  onOpenChange,
  roundId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
}) {
  const { data: readiness, isLoading } = usePublishReadiness(
    open ? roundId : null,
  );
  const publishRound = usePublishRound();

  function handlePublish() {
    if (readiness?.versionId == null) return;
    publishRound.mutate(
      { roundId, versionId: readiness.versionId },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Send} iconTone="primary">
          <DialogTitle>Công bố lịch</DialogTitle>
          <DialogDescription>
            Sau khi công bố, lịch sẽ hiển thị cho giảng viên và sinh viên; mọi
            thay đổi sau đó phải qua các thao tác post-publish (đổi phòng, thay
            reviewer, hoãn buổi).
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
                <li
                  key={blocker.code}
                  className="flex items-center justify-between gap-3"
                >
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
            disabled={
              !readiness?.ready ||
              readiness.versionId == null ||
              publishRound.isPending
            }
            onClick={handlePublish}
          >
            {publishRound.isPending ? "Đang công bố..." : "Xác nhận công bố"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PeopleSheet({
  activePanel,
  onOpenChange,
  roundId,
  round,
}: {
  activePanel: PeoplePanel | null;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  round: RoundDetail;
}) {
  const title = activePanel === "lecturers" ? "Giảng viên" : "Nhóm";

  return (
    <Sheet open={activePanel !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(92vw,34rem)] gap-0 p-0 sm:max-w-none">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Danh sách {title.toLowerCase()} của đợt đánh giá.
          </SheetDescription>
        </SheetHeader>
        <div className="flex h-full min-h-0 flex-col p-4 pt-5">
          {activePanel === "lecturers" && (
            <RoundLecturersPanel roundId={roundId} />
          )}
          {activePanel === "groups" && (
            <RoundGroupsPanel roundId={roundId} round={round} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Header xuyên suốt phía trên 3 cột — tên round, trạng thái, hành động chính theo status. */
export function RoundDetailHeader({
  roundId,
  round,
  registrationSummary,
}: {
  roundId: string;
  round: RoundDetail;
  registrationSummary?: RegistrationSummary;
}) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [activePeoplePanel, setActivePeoplePanel] =
    useState<PeoplePanel | null>(null);
  const { currentSemesterId } = useSemesterContext();
  const openRegistration = useOpenRoundRegistration();
  const closeRegistration = useCloseRoundRegistration();
  const exportCouncil = useExportCouncil();
  const { data: eligibleProjects } = useEligibleProjects(roundId);
  const { data: attachedGroups } = useRoundGroups(roundId);

  const statusMeta = ROUND_STATUS_META[round.status];
  const name =
    round.name || `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
  const futurePhaseLabel = FUTURE_PHASE_LABEL[round.status];
  const backHref = currentSemesterId
    ? `/manager/rounds?semester=${currentSemesterId}`
    : "/manager/rounds";
  const canExportCouncil = !COUNCIL_EXPORT_UNAVAILABLE_STATUSES.has(
    round.status,
  );
  const lecturerCount = registrationSummary?.lecturers.invited;
  const groupCount = useMemo(() => {
    if (!eligibleProjects && !attachedGroups) {
      const fallback = registrationSummary?.groups.eligible;
      return fallback && fallback > 0 ? fallback : undefined;
    }

    const attachedIds = new Set(
      (attachedGroups ?? []).map((group) => group.groupId),
    );
    const eligibleUnattachedCount = (eligibleProjects ?? []).filter(
      (row) => row.eligible && row.groupId && !attachedIds.has(row.groupId),
    ).length;

    return (attachedGroups?.length ?? 0) + eligibleUnattachedCount;
  }, [attachedGroups, eligibleProjects, registrationSummary?.groups.eligible]);

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-2 md:px-6">
      <Link
        href={backHref}
        aria-label="Các đợt đánh giá"
        title="Các đợt đánh giá"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>

      <div className="min-w-0 flex-1 flex items-center gap-2.5">
        <h1 className="truncate text-base font-semibold tracking-tight">
          {name}
        </h1>
        <StatusDot
          tone={statusMeta.tone}
          label={statusMeta.label}
          className="shrink-0"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="px-2 sm:px-3"
          aria-label="Mở danh sách giảng viên"
          title="Giảng viên"
          onClick={() => setActivePeoplePanel("lecturers")}
        >
          <UserPlus />
          <span className="hidden sm:inline">
            Giảng viên{lecturerCount !== undefined ? ` ${lecturerCount}` : ""}
          </span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="px-2 sm:px-3"
          aria-label="Mở danh sách nhóm"
          title="Nhóm"
          onClick={() => setActivePeoplePanel("groups")}
        >
          <UsersRound />
          <span className="hidden sm:inline">
            Nhóm{groupCount !== undefined ? ` ${groupCount}` : ""}
          </span>
        </Button>
        {round.status === "DRAFT" && (
          <Button
            size="sm"
            disabled={openRegistration.isPending}
            onClick={() => openRegistration.mutate(roundId)}
          >
            Mở đăng ký
          </Button>
        )}
        {round.status === "OPEN_REGISTRATION" && (
          <Button
            size="sm"
            disabled={closeRegistration.isPending}
            onClick={() => closeRegistration.mutate(roundId)}
          >
            Đóng đăng ký
          </Button>
        )}
        {canExportCouncil && (
          <Button
            size="sm"
            variant="outline"
            className="px-2 sm:px-3"
            disabled={exportCouncil.isPending}
            onClick={() => exportCouncil.mutate(Number(roundId))}
          >
            {exportCouncil.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            <span className="hidden sm:inline">Tải xuống </span>
          </Button>
        )}
        {round.status === "SCHEDULED" && (
          <Button size="sm" onClick={() => setPublishOpen(true)}>
            Công bố lịch
          </Button>
        )}
        {futurePhaseLabel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => notImplemented(futurePhaseLabel)}
          >
            {futurePhaseLabel}
          </Button>
        )}
      </div>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        roundId={roundId}
      />
      <PeopleSheet
        activePanel={activePeoplePanel}
        onOpenChange={(open) => {
          if (!open) setActivePeoplePanel(null);
        }}
        roundId={roundId}
        round={round}
      />
    </header>
  );
}
