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
  ExternalLink,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatTimeRange } from "@/lib/utils/formatDate";
import { StatusDot, type StatusTone } from "../../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL, SCHEDULE_VERSION_STATUS_META, INVITATION_STATUS_META } from "../../../_shared/labels";
import { useSemesterContext } from "../../../_shared/semester-context";
import {
  useRound,
  useRoundInvitations,
  useRoundGroupRoster,
  useRoundMyAvailability,
  useTransitionRound,
  useInviteLecturers,
  useSubmitLecturerAvailability,
  useResendInvitation,
  useUpdateRoundConfig,
} from "@/hooks/manager/useRounds";
import { useScheduleVersions, useRunSchedule, useActivateVersion, usePublishVersion } from "@/hooks/manager/useScheduling";
import { useLecturers } from "@/hooks/manager/useLecturers";
import type { RoundStatus, RoundConfigUpdatePayload } from "@/lib/api/services/fetchRounds";
import type { RoundInvitationRow } from "@/lib/api/services/fetchRounds";

const LOAD_LABEL = { HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" } as const;

const NEXT_ROUND_STATUS: Partial<Record<RoundStatus, { target: RoundStatus; label: string }>> = {
  DRAFT: { target: "OPEN_REGISTRATION", label: "Mở đăng ký" },
  OPEN_REGISTRATION: { target: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  REGISTRATION_CLOSED: { target: "SCHEDULING", label: "Chuyển sang xếp lịch" },
  SCHEDULED: { target: "PUBLISHED", label: "Công bố lịch" },
  COMPLETED: { target: "LOCKED", label: "Khóa đợt" },
};

function InviteLecturersDialog({
  open,
  onOpenChange,
  roundId,
  invitedIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: number;
  invitedIds: Set<number>;
}) {
  const { data: lecturers } = useLecturers();
  const inviteLecturers = useInviteLecturers();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(id: number) {
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
      { roundId, payload: { lecturer_ids: Array.from(selected) } },
      {
        onSuccess: () => {
          setSelected(new Set());
          onOpenChange(false);
        },
      }
    );
  }

  const candidates = (lecturers ?? []).filter((l) => !invitedIds.has(l.id));

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
                <Checkbox checked={selected.has(lecturer.id)} onCheckedChange={() => toggle(lecturer.id)} />
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

function SubmitAvailabilityDialog({
  open,
  onOpenChange,
  roundId,
  invitations,
  timeslots,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: number;
  invitations: RoundInvitationRow[];
  timeslots: { id: number; start_at: string; end_at: string; day_date: string }[];
}) {
  const submitAvailability = useSubmitLecturerAvailability();
  const [lecturerId, setLecturerId] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

  function toggleSlot(id: number) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lecturerId) return;
    submitAvailability.mutate(
      {
        roundId,
        lecturerId: Number(lecturerId),
        payload: { selected_timeslot_ids: Array.from(selectedSlots) },
      },
      {
        onSuccess: () => {
          setLecturerId("");
          setSelectedSlots(new Set());
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nhập lịch rảnh hộ giảng viên</DialogTitle>
            <DialogDescription>Dùng khi giảng viên quên tự đăng ký lịch rảnh.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Giảng viên</Label>
              <Select value={lecturerId} onValueChange={(v) => v && setLecturerId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giảng viên">
                    {(v: string) => {
                      const l = invitations.find((l) => String(l.lecturer_id) === v);
                      return l ? `${l.lecturer_code} — ${l.display_name}` : "Chọn giảng viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {invitations.map((l) => (
                    <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>
                      {l.lecturer_code} — {l.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Timeslot rảnh</Label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {timeslots.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">Chưa có timeslot.</p>
                )}
                {timeslots.map((slot) => (
                  <label
                    key={slot.id}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox checked={selectedSlots.has(slot.id)} onCheckedChange={() => toggleSlot(slot.id)} />
                    <span className="tabular-nums">
                      {formatDate(slot.day_date, "DD/MM")} · {formatTimeRange(slot.start_at, slot.end_at)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitAvailability.isPending || !lecturerId}>
              {submitAvailability.isPending ? "Đang lưu..." : "Lưu lịch rảnh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditRoundConfigDialog({
  open,
  onOpenChange,
  roundId,
  semesterId,
  round,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: number;
  semesterId: number | undefined;
  round: {
    end_date: string;
    reviewer_count: number;
    max_groups_per_timeslot: number;
    max_minutes_per_day: number;
  };
}) {
  const updateConfig = useUpdateRoundConfig();
  const [endDate, setEndDate] = useState(round.end_date);
  const [reviewerCount, setReviewerCount] = useState(String(round.reviewer_count));
  const [maxGroupsPerTimeslot, setMaxGroupsPerTimeslot] = useState(String(round.max_groups_per_timeslot));
  const [maxMinutesPerDay, setMaxMinutesPerDay] = useState(String(round.max_minutes_per_day));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: RoundConfigUpdatePayload = {
      end_date: endDate,
      reviewer_count: Number(reviewerCount),
      max_groups_per_timeslot: Number(maxGroupsPerTimeslot),
      max_minutes_per_day: Number(maxMinutesPerDay),
    };
    updateConfig.mutate({ roundId, payload, semesterId }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa cấu hình</DialogTitle>
            <DialogDescription>Chỉ áp dụng khi đợt còn ở trạng thái Nháp hoặc Đang mở đăng ký.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="space-y-1.5">
              <Label>Ngày kết thúc</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Số reviewer / buổi</Label>
              <Input type="number" min={1} value={reviewerCount} onChange={(e) => setReviewerCount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Nhóm tối đa / timeslot</Label>
              <Input
                type="number"
                min={1}
                value={maxGroupsPerTimeslot}
                onChange={(e) => setMaxGroupsPerTimeslot(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phút tối đa / ngày</Label>
              <Input
                type="number"
                min={1}
                value={maxMinutesPerDay}
                onChange={(e) => setMaxMinutesPerDay(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? "Đang lưu..." : "Lưu cấu hình"}
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

export function RoundDetailPage({ roundId }: { roundId: number }) {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const semesterId = currentSemester?.id;
  const [activeLecturer, setActiveLecturer] = useState<RoundInvitationRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);

  const { data: round, isLoading: roundLoading, isError: roundError } = useRound(roundId, semesterId);
  const { data: invitations, isLoading: invitationsLoading, isError: invitationsError } = useRoundInvitations(roundId, semesterId);
  const { data: groupRoster, isLoading: groupsLoading, isError: groupsError } = useRoundGroupRoster(roundId, semesterId);
  const { data: availability } = useRoundMyAvailability(roundId);
  const { data: versions, isLoading: versionsLoading, isError: versionsError } = useScheduleVersions(roundId, semesterId);

  const transitionRound = useTransitionRound();
  const runSchedule = useRunSchedule();
  const activateVersion = useActivateVersion();
  const publishVersion = usePublishVersion();
  const resendInvitation = useResendInvitation();

  const timeslots = availability?.timeslots ?? [];
  const acceptedCount = invitations?.filter((l) => l.invitation_status === "ACCEPTED").length ?? 0;
  const submittedCount = invitations?.filter((l) => l.available_slot_count > 0).length ?? 0;
  const missingSubmission = invitations?.filter((l) => l.invitation_status === "ACCEPTED" && l.available_slot_count === 0) ?? [];
  const eligibleGroups = groupRoster?.filter((g) => g.eligible).length ?? 0;

  const activeVersion = useMemo(() => versions?.find((v) => v.status === "PUBLISHED"), [versions]);

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
  const name = `${ROUND_TYPE_LABEL[round.type]} — ${currentSemesterId}`;
  const nextStatus = NEXT_ROUND_STATUS[round.status];

  function isLecturerAssignedToSlot(lecturerId: number, timeslotId: number) {
    return availability?.selected_by_lecturer?.[String(lecturerId)]?.includes(timeslotId) ?? false;
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
        {nextStatus && (
          <Button
            size="sm"
            disabled={transitionRound.isPending}
            onClick={() =>
              transitionRound.mutate({ roundId, payload: { target_status: nextStatus.target } })
            }
          >
            {nextStatus.label}
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
            <StatBlock label="Thời lượng" value={`${round.session_duration_minutes} phút`} icon={Clock} tone="sky" />
            <StatBlock label="Reviewer / buổi" value={String(round.reviewer_count)} icon={Users} tone="sky" />
            <StatNumber label="Nhóm đủ điều kiện" value={groupRoster ? eligibleGroups : null} icon={CheckCircle2} tone="emerald" />
            <StatBlock
              label="Hạn đăng ký"
              value={round.registration_deadline ? formatDate(round.registration_deadline) : "—"}
              icon={CalendarClock}
              tone="amber"
            />
            <StatNumber label="Giảng viên được mời" value={invitations ? invitations.length : null} icon={UserPlus} tone="violet" />
            <StatNumber label="Đã chấp nhận" value={invitations ? acceptedCount : null} icon={UserCheck} tone="emerald" />
            <StatNumber label="Đã gửi lịch rảnh" value={invitations ? submittedCount : null} icon={CalendarCheck} tone="sky" />
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
              disabled={round.status !== "DRAFT" && round.status !== "OPEN_REGISTRATION"}
              title={
                round.status !== "DRAFT" && round.status !== "OPEN_REGISTRATION"
                  ? "Chỉ sửa được khi đợt còn Nháp hoặc Đang mở đăng ký"
                  : undefined
              }
              onClick={() => setEditConfigOpen(true)}
            >
              <PencilLine />
              Chỉnh sửa
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatBlock label="Thời lượng" value={`${round.session_duration_minutes} phút`} icon={Clock} tone="sky" />
            <StatBlock label="Số reviewer" value={String(round.reviewer_count)} icon={Users} tone="sky" />
            <StatBlock
              label="Nhóm tự chọn lịch"
              value={round.group_selection_mode ? "Bật" : "Tắt"}
              icon={ListChecks}
              tone={round.group_selection_mode ? "emerald" : "neutral"}
            />
            <StatBlock
              label="Chỉ định Result Owner"
              value={round.result_owner_mode ? "Bật" : "Tắt"}
              icon={Award}
              tone={round.result_owner_mode ? "emerald" : "neutral"}
            />
          </div>

          <div>
            <p className="text-sm font-medium">Timeslot</p>
            {timeslots.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa tạo timeslot.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {timeslots.map((slot) => (
                  <span key={slot.id} className={cn("rounded-md border border-border px-2.5 py-1 text-xs tabular-nums")}>
                    {formatDate(slot.day_date, "DD/MM")} · {formatTimeRange(slot.start_at, slot.end_at)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lecturers" className="mt-5">
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAvailabilityOpen(true)} disabled={!invitations || invitations.length === 0}>
              <PencilLine />
              Nhập hộ
            </Button>
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
                    <TableHead>Mức tải</TableHead>
                    <TableHead className="text-right">Hạn mức</TableHead>
                    <TableHead className="text-right">Đã dùng</TableHead>
                    <TableHead className="pr-4 text-right">
                      <span className="sr-only">Hành động</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((lecturer, index) => {
                    const invitationMeta = INVITATION_STATUS_META[lecturer.invitation_status] ?? INVITATION_STATUS_META.PENDING;
                    return (
                      <TableRow
                        key={lecturer.lecturer_id}
                        className={cn("cursor-pointer", ROW_REVEAL_CLASS)}
                        style={rowRevealStyle(index)}
                        onClick={() => setActiveLecturer(lecturer)}
                      >
                        <TableCell className="pl-4">
                          <span className="font-medium">{lecturer.lecturer_code}</span>{" "}
                          <span className="text-muted-foreground">— {lecturer.display_name}</span>
                        </TableCell>
                        <TableCell>
                          <StatusDot tone={invitationMeta.tone} label={invitationMeta.label} pulse={lecturer.invitation_status === "PENDING"} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {lecturer.available_slot_count > 0 ? `${lecturer.available_slot_count} slot` : "Chưa có"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lecturer.load_preference ? LOAD_LABEL[lecturer.load_preference] : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{lecturer.semester_quota}</TableCell>
                        <TableCell className="text-right tabular-nums">{lecturer.used_quota}</TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Gửi nhắc nhở"
                            title="Gửi nhắc nhở"
                            disabled={resendInvitation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              resendInvitation.mutate({ roundId, lecturerId: lecturer.lecturer_id, semesterId });
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
          {groupsLoading && <LoadingBlock />}
          {groupsError && <ErrorBlock label="Không tải được danh sách nhóm." />}
          {groupRoster && groupRoster.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Chưa có nhóm đủ điều kiện cho đợt này.</p>
          )}
          {groupRoster && groupRoster.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Nhóm</TableHead>
                    <TableHead>Đủ điều kiện</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead className="text-right">Slot đã chọn</TableHead>
                    <TableHead className="pr-4">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRoster.map((group, index) => (
                    <TableRow key={group.group_id} className={ROW_REVEAL_CLASS} style={rowRevealStyle(index)}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{group.group_code}</TableCell>
                      <TableCell>
                        <StatusDot tone={group.eligible ? "emerald" : "red"} label={group.eligible ? "Đủ" : "Chưa đủ"} />
                      </TableCell>
                      <TableCell className={group.leader_name ? "text-muted-foreground" : "font-medium text-amber-600 dark:text-amber-400"}>
                        {group.leader_name ?? "Chưa có"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{group.selected_slot_count}</TableCell>
                      <TableCell className="pr-4 text-muted-foreground">{group.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduling" className="mt-5">
          {versionsLoading && <LoadingBlock />}
          {versionsError && <ErrorBlock label="Không tải được các phương án lịch." />}

          {versions && versions.length === 0 && (
            <div className="rounded-xl border border-border p-5">
              <p className="text-sm font-medium">Chưa chạy xếp lịch cho đợt này</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {groupRoster ? eligibleGroups : "…"} nhóm đủ điều kiện · {invitations ? invitations.length : "…"} giảng viên
              </p>
              <Button
                className="mt-4"
                size="sm"
                disabled={runSchedule.isPending}
                onClick={() => runSchedule.mutate({ roundId, semesterId })}
              >
                <Sparkles />
                {runSchedule.isPending ? "Đang chạy..." : "Chạy xếp lịch"}
              </Button>
            </div>
          )}

          {versions && versions.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{versions.length} phương án đã tạo</p>
                <div className="flex items-center gap-2">
                  <Link href={`/manager/calendar?round=${roundId}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink />
                      Mở trên Lịch đánh giá
                    </Button>
                  </Link>
                  <Button size="sm" disabled={runSchedule.isPending} onClick={() => runSchedule.mutate({ roundId, semesterId })}>
                    <Sparkles />
                    {runSchedule.isPending ? "Đang chạy..." : "Chạy lại"}
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Phương án</TableHead>
                      <TableHead>Tạo lúc</TableHead>
                      <TableHead className="text-right">Điểm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="pr-4 text-right">
                        <span className="sr-only">Hành động</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version, index) => {
                      const versionStatusMeta = SCHEDULE_VERSION_STATUS_META[version.status];
                      return (
                        <TableRow key={version.id} className={ROW_REVEAL_CLASS} style={rowRevealStyle(index)}>
                          <TableCell className="pl-4 font-mono text-xs font-medium">V{version.version_no}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(version.created_at)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {version.total_score != null ? version.total_score.toFixed(1) : "—"}
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
                                  disabled={version.status !== "VALID"}
                                  onClick={() => activateVersion.mutate({ versionId: version.id, roundId, semesterId })}
                                >
                                  Kích hoạt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={!(activeVersion === undefined && version.activated_at)}
                                  onClick={() => publishVersion.mutate({ roundId, versionId: version.id, semesterId })}
                                >
                                  Công bố lịch
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

      <Sheet open={activeLecturer !== null} onOpenChange={(open) => !open && setActiveLecturer(null)}>
        <SheetContent>
          {activeLecturer && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {activeLecturer.lecturer_code} — {activeLecturer.display_name}
                </SheetTitle>
                <SheetDescription>
                  <StatusDot
                    tone={(INVITATION_STATUS_META[activeLecturer.invitation_status] ?? INVITATION_STATUS_META.PENDING).tone}
                    label={(INVITATION_STATUS_META[activeLecturer.invitation_status] ?? INVITATION_STATUS_META.PENDING).label}
                  />
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock
                    label="Mức tải mong muốn"
                    value={activeLecturer.load_preference ? LOAD_LABEL[activeLecturer.load_preference] : "—"}
                  />
                  <StatBlock label="Hạn mức đã dùng" value={`${activeLecturer.used_quota} / ${activeLecturer.semester_quota}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Lịch rảnh</p>
                  {timeslots.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Chưa có timeslot.</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {timeslots.map((slot) => {
                        const assigned = isLecturerAssignedToSlot(activeLecturer.lecturer_id, slot.id);
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
        invitedIds={new Set((invitations ?? []).map((l) => l.lecturer_id))}
      />
      <SubmitAvailabilityDialog
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
        roundId={roundId}
        invitations={invitations ?? []}
        timeslots={timeslots}
      />
      <EditRoundConfigDialog
        open={editConfigOpen}
        onOpenChange={setEditConfigOpen}
        roundId={roundId}
        semesterId={semesterId}
        round={{
          end_date: round.end_date,
          reviewer_count: round.reviewer_count,
          max_groups_per_timeslot: round.max_groups_per_timeslot,
          max_minutes_per_day: round.max_minutes_per_day,
        }}
      />
    </div>
  );
}
