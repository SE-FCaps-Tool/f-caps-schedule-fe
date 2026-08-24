"use client";

import { useMemo, useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { INVITATION_STATUS_META } from "@/app/(manager)/manager/_shared/labels";
import { useRoundInvitations, useRemindInvitation, useInviteLecturers, useRoundMyAvailability } from "@/hooks/manager/useRounds";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { formatDate, formatTimeRange } from "@/lib/utils/formatDate";
import { ErrorBlock, LoadingBlock, PanelHeading, ROW_REVEAL_CLASS, StatBlock, rowRevealStyle } from "./round-detail-shared";
import { CollapseButton } from "./collapsible-aside-panel";
import type { RoundInvitation } from "@/lib/api/services/fetchRounds";

function InviteLecturersDialog({
  open,
  onOpenChange,
  roundId,
  invitedIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  invitedIds: Set<string>;
}) {
  const { data: lecturers } = useLecturers();
  const inviteLecturers = useInviteLecturers();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) setSelected(new Set());
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    inviteLecturers.mutate(
      { roundId, payload: { lecturerIds: Array.from(selected) } },
      {
        onSuccess: () => {
          setSelected(new Set());
          onOpenChange(false);
        },
      }
    );
  }

  const candidates = (lecturers ?? []).filter((l) => !invitedIds.has(String(l.id)));
  const allSelected = candidates.length > 0 && candidates.every((l) => selected.has(String(l.id)));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(candidates.map((l) => String(l.id))));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UserPlus} iconTone="sky">
            <DialogTitle>Mời giảng viên</DialogTitle>
            <DialogDescription>Chọn giảng viên chưa được mời cho đợt này.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs text-muted-foreground">
              {candidates.length} chưa mời · đã chọn {selected.size}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={toggleAll} disabled={candidates.length === 0}>
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto py-4">
            {candidates.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Mọi giảng viên đã được mời.</p>
            )}
            {candidates.map((lecturer) => (
              <label
                key={lecturer.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <Checkbox checked={selected.has(String(lecturer.id))} onCheckedChange={() => toggle(String(lecturer.id))} />
                <span className="font-medium">{lecturer.lecturerCode}</span>
                <span className="text-muted-foreground">— {lecturer.displayName}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={inviteLecturers.isPending || selected.size === 0}>
              {inviteLecturers.isPending ? "Đang gửi..." : `Mời ${selected.size > 0 ? selected.size : ""} giảng viên`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cột phải — danh sách giảng viên được mời cho round, dạng list gọn cho cột hẹp. Panel bọc ngoài đóng/mở theo chiều ngang. */
export function RoundLecturersPanel({ roundId, onCollapse }: { roundId: string; onCollapse: () => void }) {
  const [activeInvitation, setActiveInvitation] = useState<RoundInvitation | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: invitations, isLoading, isError } = useRoundInvitations(roundId);
  const remindInvitation = useRemindInvitation();

  const legacyRoundId = Number(roundId);
  const { data: availability } = useRoundMyAvailability(legacyRoundId);
  const timeslots = availability?.timeslots ?? [];
  const selectedByLecturer = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selectedByLecturer ?? []) {
      if (row.state !== "AVAILABLE") continue;
      const lecturerId = Number(row.lecturerId);
      const timeslotId = Number(row.timeslotId);
      if (!map.has(lecturerId)) map.set(lecturerId, new Set());
      map.get(lecturerId)!.add(timeslotId);
    }
    return map;
  }, [availability]);

  function isLecturerAssignedToSlot(lecturerId: number, timeslotId: number) {
    return selectedByLecturer.get(lecturerId)?.has(timeslotId) ?? false;
  }

  const missingSubmission = invitations?.filter((l) => l.status === "ACCEPTED" && l.availabilitySlotCount === 0) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-1">
        <PanelHeading>Giảng viên{invitations ? ` (${invitations.length})` : ""}</PanelHeading>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Mời giảng viên" title="Mời giảng viên" onClick={() => setInviteOpen(true)}>
            <UserPlus />
          </Button>
          <CollapseButton onClick={onCollapse} label="Thu gọn Giảng viên" />
        </div>
      </div>

      {missingSubmission.length > 0 && (
        <p className="shrink-0 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          {missingSubmission.length} giảng viên đã nhận lời nhưng chưa gửi lịch rảnh — coi như bận toàn bộ.
        </p>
      )}

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock label="Không tải được danh sách giảng viên." />}
      {invitations && invitations.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa mời giảng viên nào cho đợt này.</p>
      )}
      {invitations && invitations.length > 0 && (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {invitations.map((invitation, index) => {
            const meta = INVITATION_STATUS_META[invitation.status] ?? INVITATION_STATUS_META.PENDING;
            return (
              <div
                key={invitation.id}
                role="button"
                tabIndex={0}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40 ${ROW_REVEAL_CLASS}`}
                style={rowRevealStyle(index)}
                onClick={() => setActiveInvitation(invitation)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveInvitation(invitation);
                  }
                }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {invitation.lecturer.code}
                    <span className="font-normal text-muted-foreground"> — {invitation.lecturer.fullName}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                    {invitation.availabilitySlotCount > 0 ? `${invitation.availabilitySlotCount} slot` : "Chưa có lịch rảnh"} ·{" "}
                    {invitation.usedQuota}/{invitation.semesterQuota}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <StatusDot tone={meta.tone} label={meta.label} pulse={invitation.status === "PENDING"} className="hidden sm:inline-flex" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Gửi nhắc nhở"
                    title="Gửi nhắc nhở"
                    disabled={remindInvitation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      remindInvitation.mutate({ roundId, invitationId: invitation.id });
                    }}
                  >
                    <Mail />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={activeInvitation !== null} onOpenChange={(open) => !open && setActiveInvitation(null)}>
        <SheetContent>
          {activeInvitation && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {activeInvitation.lecturer.code} — {activeInvitation.lecturer.fullName}
                </SheetTitle>
                <SheetDescription>
                  <StatusDot
                    tone={(INVITATION_STATUS_META[activeInvitation.status] ?? INVITATION_STATUS_META.PENDING).tone}
                    label={(INVITATION_STATUS_META[activeInvitation.status] ?? INVITATION_STATUS_META.PENDING).label}
                  />
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock label="Lịch rảnh đã nộp" value={`${activeInvitation.availabilitySlotCount} slot`} />
                  <StatBlock label="Hạn mức đã dùng" value={`${activeInvitation.usedQuota} / ${activeInvitation.semesterQuota}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Lịch rảnh</p>
                  {timeslots.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Chưa có timeslot.</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {timeslots.map((slot) => {
                        const assigned = isLecturerAssignedToSlot(Number(activeInvitation.lecturer.id), slot.id);
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
                          >
                            <span className="tabular-nums">
                              {formatDate(slot.dayDate, "DD/MM")} · {formatTimeRange(slot.startAt, slot.endAt)}
                            </span>
                            {assigned ? <StatusDot tone="violet" label="Đã xếp" /> : <StatusDot tone="emerald" label="Rảnh" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <InviteLecturersDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roundId={roundId}
        invitedIds={new Set((invitations ?? []).map((l) => l.lecturer.id))}
      />
    </div>
  );
}
