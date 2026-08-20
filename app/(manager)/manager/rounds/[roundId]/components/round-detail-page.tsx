"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Award,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Grid3x3,
  ListChecks,
  Mail,
  MoreHorizontal,
  PencilLine,
  Sparkles,
  Users,
  UserCheck,
  UserPlus,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDate, formatTimeRange } from "@/lib/utils/formatDate";
import { toast } from "sonner";
import { StatusDot, type StatusTone } from "../../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL, ROUND_SCHEDULE_VERSION_STATUS_META, INVITATION_STATUS_META } from "../../../_shared/labels";
import { useSemesterContext } from "../../../_shared/semester-context";
import {
  useRoundDetail,
  useRoundInvitations,
  useEligibleProjects,
  useRegistrationSummary,
  useRoundMyAvailability,
  useAttachRoundResources,
  useOpenRoundRegistration,
  useCloseRoundRegistration,
  useInviteLecturers,
  useRemindInvitation,
} from "@/hooks/manager/useRounds";
import { RoundConfigEditDialog } from "./round-config-edit-dialog";
import {
  useSchedulingReadiness,
  useRoundScheduleVersions,
  useGenerateSchedule,
  useSetActiveScheduleVersion,
  useDiscardScheduleVersion,
  usePublishReadiness,
  usePublishRound,
} from "@/hooks/manager/useScheduling";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { useGroups } from "@/hooks/manager/useGroups";
import type { RoomType, RoundStatus, RoundInvitation } from "@/lib/api/services/fetchRounds";
import type { GroupListItem } from "@/lib/api/services/fetchGroups";

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  NORMAL: "Phòng thường",
  SEMINAR: "Seminar",
  LAB: "Lab",
};

/**
 * Trạng thái mà spec chưa có action endpoint cụ thể (thuộc Phase 8) — chỉ hiển thị, chưa bấm được.
 * REGISTRATION_CLOSED không còn ở đây: xếp lịch giờ thao tác trực tiếp trong tab "Xếp lịch"
 * (Generate + Set Active theo spec §58/§64), không có transition riêng để "bắt đầu xếp lịch".
 * SCHEDULED cũng không còn ở đây: Công bố lịch giờ là nút thật, gate theo publish-readiness (§29/§69/§70).
 */
const FUTURE_PHASE_LABEL: Partial<Record<RoundStatus, string>> = {
  COMPLETED: "Khóa đợt",
};

function notImplemented(action: string) {
  toast.info(`${action} — chưa có trong spec BE, cần chốt endpoint`);
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mời giảng viên</DialogTitle>
            <DialogDescription>Chọn giảng viên chưa được mời cho đợt này.</DialogDescription>
          </DialogHeader>

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
                <span className="font-medium">{lecturer.lecturer_code}</span>
                <span className="text-muted-foreground">— {lecturer.display_name}</span>
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

/** Chip màu nhẹ sau icon stat — cùng bảng màu với StatusDot, dùng có ý nghĩa (không trang trí tuỳ ý). */
const ICON_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function StatIcon({ icon: Icon, tone = "neutral" }: { icon: LucideIcon; tone?: StatusTone }) {
  return (
    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", ICON_TONE_CLASSES[tone])}>
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

function StatBlock({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <StatIcon icon={icon} tone={tone} />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

/** Đếm số chạy tới `target` khi giá trị đổi — dùng cho stat vừa tải xong, không dùng cho giá trị đã có sẵn. */
function useCountUp(target: number, durationMs = 450) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (reducedMotion || from === target) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reducedMotion]);

  return display;
}

/** StatBlock cho số vừa tải xong (đếm lên từ 0) — giữ "…" cho tới khi có dữ liệu thật. */
function StatNumber({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  const display = useCountUp(value ?? 0);
  return (
    <div className="flex items-start gap-2.5">
      {icon && <StatIcon icon={icon} tone={tone} />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value === null ? "…" : display}</p>
      </div>
    </div>
  );
}

/** Delay stagger nhẹ cho hàng bảng khi vào tab — chặn ở hàng thứ 8 để danh sách dài không bị trễ. */
function rowRevealStyle(index: number): React.CSSProperties {
  return { animationDelay: `${Math.min(index, 8) * 35}ms`, animationDuration: "260ms" };
}
const ROW_REVEAL_CLASS = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-backwards";

function LoadingBlock() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function ErrorBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <WifiOff className="size-4 shrink-0" />
      {label}
    </div>
  );
}

export function RoundDetailPage({ roundId }: { roundId: string }) {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const semesterId = currentSemester?.id;
  // Calendar/Room (Phase 5 — chưa migrate, cần Room tồn tại trước) vẫn dùng id số của backend cũ.
  const legacyRoundId = Number(roundId);
  const [activeInvitation, setActiveInvitation] = useState<RoundInvitation | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [configEditOpen, setConfigEditOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const { data: round, isLoading: roundLoading, isError: roundError } = useRoundDetail(roundId);
  const { data: invitations, isLoading: invitationsLoading, isError: invitationsError } = useRoundInvitations(roundId);
  const { data: eligibleProjects, isLoading: groupsLoading, isError: groupsError } = useEligibleProjects(roundId);
  const { data: groupsResult } = useGroups(semesterId);
  const { data: registrationSummary } = useRegistrationSummary(roundId);
  const { data: availability } = useRoundMyAvailability(legacyRoundId);
  const selectedByLecturer = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of availability?.selected_by_lecturer ?? []) {
      if (row.state !== "AVAILABLE") continue;
      const lecturerId = Number(row.lecturer_id);
      const timeslotId = Number(row.timeslot_id);
      if (!map.has(lecturerId)) map.set(lecturerId, new Set());
      map.get(lecturerId)!.add(timeslotId);
    }
    return map;
  }, [availability]);
  const { data: readiness } = useSchedulingReadiness(roundId);
  const { data: roundVersions, isLoading: roundVersionsLoading, isError: roundVersionsError } = useRoundScheduleVersions(roundId);

  const openRegistration = useOpenRoundRegistration();
  const closeRegistration = useCloseRoundRegistration();
  const generateSchedule = useGenerateSchedule();
  const setActiveVersion = useSetActiveScheduleVersion();
  const discardVersion = useDiscardScheduleVersion();
  const remindInvitation = useRemindInvitation();
  const attachRoundResources = useAttachRoundResources();

  const timeslots = availability?.timeslots ?? [];
  const missingSubmission = invitations?.filter((l) => l.status === "ACCEPTED" && l.availabilitySlotCount === 0) ?? [];

  const groupById = useMemo(() => {
    const map = new Map<string, GroupListItem>();
    for (const g of groupsResult?.data ?? []) map.set(g.id, g);
    return map;
  }, [groupsResult]);

  if (roundLoading) {
    return (
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-8 w-64" />
        <div className="mt-8">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  if (roundError || !round) {
    return <ErrorBlock label="Không tải được đợt đánh giá. Thử tải lại trang." />;
  }

  const statusMeta = ROUND_STATUS_META[round.status];
  const name = round.name || `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
  const futurePhaseLabel = FUTURE_PHASE_LABEL[round.status];
  const canEditConfig = round.status === "DRAFT" || round.status === "OPEN_REGISTRATION";
  const roundTimeslots = round.days.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date })));
  const roundRoomTypes = round.roomTypes;

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function attachSelectedGroups() {
    if (selectedGroupIds.size === 0) return;
    if (roundTimeslots.length === 0 || roundRoomTypes.length === 0) {
      toast.error("Round cần có timeslot và loại phòng trước khi gắn nhóm");
      return;
    }
    attachRoundResources.mutate(
      {
        roundId,
        payload: {
          groupIds: [...selectedGroupIds],
          timeslotIds: roundTimeslots.map((slot) => slot.id),
          roomTypes: roundRoomTypes,
        },
      },
      { onSuccess: () => setSelectedGroupIds(new Set()) }
    );
  }

  function isLecturerAssignedToSlot(lecturerId: number, timeslotId: number) {
    return selectedByLecturer.get(lecturerId)?.has(timeslotId) ?? false;
  }

  return (
    <div>
      <Link
        href="/manager/rounds"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Các đợt đánh giá
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm">
            <StatusDot tone={statusMeta.tone} label={statusMeta.label} />
          </div>
        </div>
        {round.status === "DRAFT" && (
          <Button size="sm" disabled={openRegistration.isPending} onClick={() => openRegistration.mutate(roundId)}>
            Mở đăng ký
          </Button>
        )}
        {round.status === "OPEN_REGISTRATION" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={closeRegistration.isPending} onClick={() => closeRegistration.mutate(roundId)}>
              Đóng đăng ký
            </Button>
          </div>
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

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
          <TabsTrigger value="lecturers">Giảng viên</TabsTrigger>
          <TabsTrigger value="groups">Nhóm tham gia</TabsTrigger>
          <TabsTrigger value="scheduling">Xếp lịch</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatBlock label="Thời lượng" value={`${round.durationMinutes} phút`} icon={Clock} tone="sky" />
            <StatBlock label="Reviewer / buổi" value={String(round.reviewerCount)} icon={Users} tone="sky" />
            <StatNumber
              label="Nhóm đủ điều kiện"
              value={registrationSummary ? registrationSummary.groups?.eligible : null}
              icon={CheckCircle2}
              tone="emerald"
            />
            <StatBlock
              label="Hạn đăng ký chọn lịch"
              value={round.registrationDeadline ? formatDate(round.registrationDeadline) : "—"}
              icon={CalendarClock}
              tone="amber"
            />
            <StatNumber
              label="Giảng viên được mời"
              value={registrationSummary ? registrationSummary.lecturers?.invited : null}
              icon={UserPlus}
              tone="violet"
            />
            <StatNumber
              label="Đã chấp nhận"
              value={registrationSummary ? registrationSummary.lecturers?.accepted : null}
              icon={UserCheck}
              tone="emerald"
            />
            <StatNumber
              label="Đã gửi lịch rảnh"
              value={registrationSummary ? registrationSummary.lecturers?.availabilitySubmitted : null}
              icon={CalendarCheck}
              tone="sky"
            />
          </div>

          {missingSubmission.length > 0 && (
            <p className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              {missingSubmission.length} giảng viên đã nhận lời nhưng chưa gửi lịch rảnh — coi như bận toàn bộ.
            </p>
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-5 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cấu hình đợt đánh giá</p>
            <Button
              variant="outline"
              size="sm"
              title={canEditConfig ? "Chỉnh sửa cấu hình" : "Chỉ sửa được khi Round còn Nháp hoặc Đang mở đăng ký"}
              disabled={!canEditConfig}
              onClick={() => setConfigEditOpen(true)}
            >
              <PencilLine />
              Chỉnh sửa
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatBlock
              label="Khoảng thời gian"
              value={
                round.startDate && round.endDate
                  ? `${formatDate(round.startDate, "DD/MM")} – ${formatDate(round.endDate, "DD/MM/YYYY")}`
                  : "—"
              }
              icon={CalendarClock}
              tone="amber"
            />
            <StatBlock label="Thời lượng" value={`${round.durationMinutes} phút`} icon={Clock} tone="sky" />
            <StatBlock label="Số reviewer" value={String(round.reviewerCount)} icon={Users} tone="sky" />
            <StatBlock label="Nhóm tối đa / slot" value={String(round.maxGroupsPerTimeslot)} icon={Grid3x3} tone="sky" />
            <StatBlock
              label="Nhóm tự chọn lịch"
              value={round.groupSelectionMode ? "Bật" : "Tắt"}
              icon={ListChecks}
              tone={round.groupSelectionMode ? "emerald" : "neutral"}
            />
            <StatBlock
              label="Chỉ định Result Owner"
              value={round.resultOwnerMode ? "Bật" : "Tắt"}
              icon={Award}
              tone={round.resultOwnerMode ? "emerald" : "neutral"}
            />
          </div>

          <div>
            <p className="text-sm font-medium">Loại phòng cho phép</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {round.roomTypes?.map((rt) => (
                <span key={rt} className="rounded-md border border-border px-2.5 py-1 text-xs">
                  {ROOM_TYPE_LABEL[rt]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Timeslot</p>
            {roundTimeslots?.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa tạo timeslot.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {roundTimeslots?.map((slot, index) => (
                  <span key={`${slot.date}-${index}`} className={cn("rounded-md border border-border px-2.5 py-1 text-xs tabular-nums")}>
                    {formatDate(slot.date, "DD/MM")} · {slot.startTime}–{slot.endTime}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lecturers" className="mt-5">
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus />
              Mời giảng viên
            </Button>
          </div>

          {invitationsLoading && <LoadingBlock />}
          {invitationsError && <ErrorBlock label="Không tải được danh sách giảng viên." />}
          {invitations && invitations.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Chưa mời giảng viên nào cho đợt này.</p>
          )}
          {invitations && invitations.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Giảng viên</TableHead>
                    <TableHead>Lời mời</TableHead>
                    <TableHead className="text-right">Lịch rảnh</TableHead>
                    <TableHead className="text-right">Hạn mức</TableHead>
                    <TableHead className="text-right">Đã dùng</TableHead>
                    <TableHead className="pr-4 text-right">
                      <span className="sr-only">Hành động</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation, index) => {
                    const invitationMeta = INVITATION_STATUS_META[invitation.status] ?? INVITATION_STATUS_META.PENDING;
                    return (
                      <TableRow
                        key={invitation.id}
                        className={cn("cursor-pointer", ROW_REVEAL_CLASS)}
                        style={rowRevealStyle(index)}
                        onClick={() => setActiveInvitation(invitation)}
                      >
                        <TableCell className="pl-4">
                          <span className="font-medium">{invitation.lecturer.code}</span>{" "}
                          <span className="text-muted-foreground">— {invitation.lecturer.fullName}</span>
                        </TableCell>
                        <TableCell>
                          <StatusDot tone={invitationMeta.tone} label={invitationMeta.label} pulse={invitation.status === "PENDING"} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {invitation.availabilitySlotCount > 0 ? `${invitation.availabilitySlotCount} slot` : "Chưa có"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{invitation.semesterQuota}</TableCell>
                        <TableCell className="text-right tabular-nums">{invitation.usedQuota}</TableCell>
                        <TableCell className="pr-4 text-right">
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Chọn nhóm đủ điều kiện để đăng ký vào Round này.
            </p>
            <Button
              size="sm"
              disabled={selectedGroupIds.size === 0 || attachRoundResources.isPending}
              onClick={attachSelectedGroups}
            >
              {attachRoundResources.isPending
                ? "Đang gắn..."
                : selectedGroupIds.size > 0
                  ? `Gắn ${selectedGroupIds.size} nhóm vào Round`
                  : "Gắn nhóm vào Round"}
            </Button>
          </div>
          {groupsLoading && <LoadingBlock />}
          {groupsError && <ErrorBlock label="Không tải được danh sách nhóm." />}
          {eligibleProjects && eligibleProjects.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Chưa có nhóm/đề tài nào cho đợt này.</p>
          )}
          {eligibleProjects && eligibleProjects.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4"><span className="sr-only">Chọn</span></TableHead>
                    <TableHead className="pl-4">Nhóm</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead className="text-right">Thành viên</TableHead>
                    <TableHead>Cảnh báo</TableHead>
                    <TableHead className="pr-4">Đủ điều kiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligibleProjects.map((row, index) => {
                    const group = groupById.get(row.groupId);
                    return (
                      <TableRow key={row.projectId} className={ROW_REVEAL_CLASS} style={rowRevealStyle(index)}>
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedGroupIds.has(row.groupId)}
                            disabled={!row.eligible || !row.groupId || attachRoundResources.isPending}
                            onCheckedChange={() => row.groupId && toggleGroup(row.groupId)}
                            aria-label={`Chọn nhóm ${group?.code ?? row.groupId}`}
                          />
                        </TableCell>
                        <TableCell className="pl-4 font-mono text-xs font-medium">{group?.code ?? row.groupId}</TableCell>
                        <TableCell className={group?.leader ? "text-muted-foreground" : "font-medium text-amber-600 dark:text-amber-400"}>
                          {group?.leader?.fullName ?? "Chưa có"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{group?.memberCount ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.blockingReasons.length > 0
                            ? row.blockingReasons.join(", ")
                            : row.warnings.length > 0
                              ? row.warnings.map((w) => w.message).join(", ")
                              : "—"}
                        </TableCell>
                        <TableCell className="pr-4">
                          <StatusDot tone={row.eligible ? "emerald" : "red"} label={row.eligible ? "Đủ" : "Chưa đủ"} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduling" className="mt-5">
          {readiness && !readiness.ready && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">Chưa đủ điều kiện chạy xếp lịch</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700 dark:text-amber-400">
                {readiness.blockingIssues?.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {readiness && readiness.warnings?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {readiness.warnings.map((w) => (
                <span key={w.code} className="rounded-md border border-border px-2 py-1">
                  {w.code}: {w.count}
                </span>
              ))}
            </div>
          )}

          {roundVersionsLoading && <LoadingBlock />}
          {roundVersionsError && <ErrorBlock label="Không tải được các phương án lịch." />}

          {roundVersions && roundVersions.length === 0 && (
            <div className="rounded-xl border border-border p-5">
              <p className="text-sm font-medium">Chưa chạy xếp lịch cho đợt này</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {readiness ? readiness.counts?.eligibleProjects : "…"} nhóm đủ điều kiện ·{" "}
                {readiness ? readiness.counts?.availableLecturers : "…"} giảng viên rảnh
              </p>
              <Button
                className="mt-4"
                size="sm"
                disabled={generateSchedule.isPending || !readiness?.ready}
                onClick={() => generateSchedule.mutate(roundId)}
              >
                <Sparkles />
                {generateSchedule.isPending ? "Đang chạy..." : "Chạy xếp lịch"}
              </Button>
            </div>
          )}

          {roundVersions && roundVersions.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{roundVersions.length} phương án đã tạo</p>
                <Button
                  size="sm"
                  disabled={generateSchedule.isPending || !readiness?.ready}
                  onClick={() => generateSchedule.mutate(roundId)}
                >
                  <Sparkles />
                  {generateSchedule.isPending ? "Đang chạy..." : "Chạy lại"}
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Phương án</TableHead>
                      <TableHead className="text-right">Đã xếp</TableHead>
                      <TableHead className="text-right">Chưa xếp</TableHead>
                      <TableHead className="text-right">Điểm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="pr-4 text-right">
                        <span className="sr-only">Hành động</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roundVersions.map((version, index) => {
                      const versionStatusMeta = ROUND_SCHEDULE_VERSION_STATUS_META[version.status];
                      return (
                        <TableRow key={version.id} className={ROW_REVEAL_CLASS} style={rowRevealStyle(index)}>
                          <TableCell className="pl-4 font-mono text-xs font-medium">V{version.versionNumber}</TableCell>
                          <TableCell className="text-right tabular-nums">{version.scheduledCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{version.unscheduledCount}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {version.overallScore != null ? version.overallScore.toFixed(1) : "—"}
                          </TableCell>
                          <TableCell>
                            <StatusDot tone={versionStatusMeta.tone} label={versionStatusMeta.label} />
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm" aria-label="Hành động">
                                    <MoreHorizontal />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={version.status !== "DRAFT"}
                                  onClick={() => setActiveVersion.mutate({ roundId, versionId: version.id })}
                                >
                                  Kích hoạt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={version.status !== "DRAFT"}
                                  onClick={() => discardVersion.mutate({ roundId, versionId: version.id })}
                                >
                                  Loại bỏ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={version.status !== "ACTIVE"}
                                  render={<Link href={`/manager/rounds/${roundId}/room-assignment`} />}
                                >
                                  Gán phòng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

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
                              {formatDate(slot.day_date, "DD/MM")} · {formatTimeRange(slot.start_at, slot.end_at)}
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
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        roundId={roundId}
      />
      <RoundConfigEditDialog
        open={configEditOpen}
        onOpenChange={setConfigEditOpen}
        round={round}
      />
    </div>
  );
}
