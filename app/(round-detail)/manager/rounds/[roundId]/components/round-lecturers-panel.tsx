"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Mail, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { ErrorBlock, LoadingBlock, ROW_REVEAL_CLASS, StatBlock, rowRevealStyle } from "./round-detail-shared";
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
export function RoundLecturersPanel({ roundId }: { roundId: string }) {
  const [activeInvitation, setActiveInvitation] = useState<RoundInvitation | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACCEPTED" | "PENDING" | "MISSING">("ALL");

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

  const acceptedCount = invitations?.filter((invitation) => invitation.status === "ACCEPTED").length ?? 0;
  const pendingCount = invitations?.filter((invitation) => invitation.status === "PENDING").length ?? 0;
  const missingSubmission = invitations?.filter((invitation) => invitation.status === "ACCEPTED" && invitation.availabilitySlotCount === 0) ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];

    return invitations.filter((invitation) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invitation.lecturer.code.toLowerCase().includes(normalizedSearch) ||
        invitation.lecturer.fullName.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACCEPTED" && invitation.status === "ACCEPTED") ||
        (filter === "PENDING" && invitation.status === "PENDING") ||
        (filter === "MISSING" && invitation.status === "ACCEPTED" && invitation.availabilitySlotCount === 0);

      return matchesSearch && matchesFilter;
    });
  }, [filter, invitations, normalizedSearch]);

  const filters = [
    { value: "ALL" as const, label: "Tất cả", count: invitations?.length ?? 0 },
    { value: "ACCEPTED" as const, label: "Đã nhận", count: acceptedCount },
    { value: "PENDING" as const, label: "Chờ phản hồi", count: pendingCount },
    { value: "MISSING" as const, label: "Thiếu lịch", count: missingSubmission.length },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Giảng viên</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {invitations?.length ?? "…"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {invitations ? `${acceptedCount} đã nhận · ${missingSubmission.length} thiếu lịch` : "Đang tải dữ liệu..."}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" aria-label="Mời giảng viên" title="Mời giảng viên" onClick={() => setInviteOpen(true)}>
            <UserPlus />
            <span className="hidden sm:inline">Mời giảng viên</span>
            <span className="sm:hidden">Mời</span>
          </Button>
        </div>
      </div>

      {missingSubmission.length > 0 && (
        <p className="shrink-0 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          {missingSubmission.length} giảng viên đã nhận lời nhưng chưa gửi lịch rảnh — coi như bận toàn bộ.
        </p>
      )}

      <div className="shrink-0 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã hoặc tên..."
            aria-label="Tìm giảng viên theo mã hoặc tên"
            className="h-9 pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              title="Xóa tìm kiếm"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Lọc giảng viên">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="xs"
              variant={filter === item.value ? "secondary" : "ghost"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className="shrink-0"
            >
              {item.label}
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock label="Không tải được danh sách giảng viên." />}
      {invitations && invitations.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa mời giảng viên nào cho đợt này.</p>
      )}
      {invitations && invitations.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {filteredInvitations.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy giảng viên phù hợp.</p>
          )}
          {filteredInvitations.length > 0 && (
            <div className="divide-y divide-border/80">
              {filteredInvitations.map((invitation, index) => {
                const meta = INVITATION_STATUS_META[invitation.status] ?? INVITATION_STATUS_META.PENDING;
                const reminderLabel =
                  invitation.status === "PENDING"
                    ? "Nhắc phản hồi"
                    : invitation.status === "ACCEPTED" && invitation.availabilitySlotCount === 0
                      ? "Nhắc gửi lịch rảnh"
                      : "Gửi nhắc nhở";

                return (
                  <div
                    key={invitation.id}
                    className={`group flex w-full items-center gap-3 px-1 py-3 text-left text-sm transition-colors hover:bg-muted/35 ${ROW_REVEAL_CLASS}`}
                    style={rowRevealStyle(index)}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-md text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => setActiveInvitation(invitation)}
                    >
                      <p className="truncate font-semibold tracking-tight" title={invitation.lecturer.code}>
                        {invitation.lecturer.code}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground" title={invitation.lecturer.fullName}>
                        {invitation.lecturer.fullName}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground tabular-nums">
                        <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                        <span className={invitation.availabilitySlotCount === 0 ? "text-amber-700 dark:text-amber-400" : undefined}>
                          {invitation.availabilitySlotCount > 0 ? `${invitation.availabilitySlotCount} slot` : "Chưa có lịch rảnh"}
                        </span>
                        <span aria-hidden>·</span>
                        <span>
                          {invitation.usedQuota}/{invitation.semesterQuota} hạn mức
                        </span>
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusDot
                        tone={meta.tone}
                        label={meta.label}
                        pulse={invitation.status === "PENDING"}
                        className="rounded-full bg-muted/60 px-2 py-1 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={reminderLabel}
                        title={reminderLabel}
                        disabled={remindInvitation.isPending}
                        className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
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
