"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  DoorOpen,
  FileText,
  Settings2,
  Timer,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ROUND_TYPE_LABEL } from "@/app/(manager)/manager/_shared/labels";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useCreateRound } from "@/hooks/manager/useRounds";
import { useTimeframe, useTimeframes } from "@/hooks/useTimeframes";
import type {
  RoomType,
  RoundCreatePayload,
  RoundDayInput,
  RoundType,
} from "@/lib/api/services/fetchRounds";
import type { Timeframe } from "@/lib/api/services/fetchTimeframes";
import { buildRoundCreatePayload } from "@/lib/api/services/roundTimeframeContract";
import {
  RoundScheduleCalendar,
  type DayDraft,
  type DeadlineDraft,
} from "./round-schedule-calendar";
import { RoundTimeframePreview } from "./round-timeframe-preview";

const ROUND_TYPES: RoundType[] = [
  "REVIEW_1",
  "REVIEW_2",
  "DEFENSE_1_1",
  "DEFENSE_1_2",
  "DEFENSE_2",
];

/**
 * BE chỉ chấp nhận resultOwnerMode=true cho DEFENSE_1_1/DEFENSE_2 (422 nếu không).
 * DEFENSE_1_2 lẽ ra cũng là "Defense" theo PRD nhưng BE đang loại trừ tạm thời — xem
 * docs/be-checklist-open-questions.md. Không tự ý thêm DEFENSE_1_2 vào đây cho tới khi BE xác nhận lại.
 */
const RESULT_OWNER_ALLOWED_TYPES = new Set<RoundType>([
  "DEFENSE_1_1",
  "DEFENSE_2",
]);

/** Mặc định reviewer/buổi theo loại đợt — spec §20 Step 1 */
const DEFAULT_REVIEWER_COUNT: Record<RoundType, number> = {
  REVIEW_1: 2,
  REVIEW_2: 2,
  DEFENSE_1_1: 3,
  DEFENSE_1_2: 5,
  DEFENSE_2: 5,
};

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  NORMAL: "Phòng thường",
  SEMINAR: "Seminar",
  LAB: "Lab",
};

const ROOM_TYPES: RoomType[] = ["NORMAL", "SEMINAR", "LAB"];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((((total % 1440) + 1440) % 1440) / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function slotsOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function StepHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function CreateRoundWizard() {
  const router = useRouter();
  const {
    currentSemester,
    currentSemesterId,
    isLoading: isSemesterContextLoading,
    isError: isSemesterContextError,
  } = useSemesterContext();
  const createRound = useCreateRound(currentSemester?.id);
  const {
    data: timeframes = [],
    isLoading: timeframesLoading,
    isError: timeframesError,
    refetch: refetchTimeframes,
  } = useTimeframes();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<1 | 2>(1);

  // `?semester=` không khớp học kỳ nào (đã bị xoá, hoặc BE chưa có học kỳ nào) —
  // currentSemester luôn null nên nút "Tạo đợt đánh giá" bị khoá vô thời hạn mà
  // không có phản hồi gì cho Manager. Log rõ nguyên nhân + báo cho người dùng.
  const semesterNotFound =
    !isSemesterContextLoading && !isSemesterContextError && !currentSemester;

  useEffect(() => {
    if (semesterNotFound) {
      console.error(
        `[CreateRoundWizard] Không tạo được đợt đánh giá: học kỳ "${currentSemesterId}" không tồn tại hoặc chưa có học kỳ nào trong hệ thống (GET /api/v1/semesters trả về danh sách rỗng hoặc không chứa mã này).`
      );
    }
  }, [semesterNotFound, currentSemesterId]);

  // Bước 1
  const [name, setName] = useState("");
  const [type, setType] = useState<RoundType>("REVIEW_1");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [reviewerCount, setReviewerCount] = useState(
    String(DEFAULT_REVIEWER_COUNT.REVIEW_1),
  );
  const [maxGroupsPerTimeslot, setMaxGroupsPerTimeslot] = useState("3");
  const [resultOwnerMode, setResultOwnerMode] = useState(false);
  const [roomTypes, setRoomTypes] = useState<Set<RoomType>>(new Set());
  const [groupSelectionMode, setGroupSelectionMode] = useState(true);
  const [scheduleSource, setScheduleSource] = useState<"timeframe" | "manual">("timeframe");
  const [timeframeId, setTimeframeId] = useState("");
  const [pendingScheduleSource, setPendingScheduleSource] = useState<"timeframe" | "manual" | null>(null);

  // Bước 2 — lịch
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] =
    useState<DeadlineDraft | null>(null);
  const [days, setDays] = useState<DayDraft[]>([]);

  const selectedTimeframeFromList = timeframes.find((item) => String(item.id) === timeframeId) ?? null;
  const selectedTimeframeId = timeframeId ? Number(timeframeId) : null;
  const { data: selectedTimeframeDetail, isLoading: timeframeDetailLoading, isError: timeframeDetailError, refetch: refetchTimeframe } =
    useTimeframe(selectedTimeframeId);
  const selectedTimeframe: Timeframe | null = selectedTimeframeDetail ?? selectedTimeframeFromList;

  const duration = Number(durationMinutes) || 0;

  function handleTypeChange(v: RoundType) {
    setType(v);
    setReviewerCount(String(DEFAULT_REVIEWER_COUNT[v]));
    if (!RESULT_OWNER_ALLOWED_TYPES.has(v)) setResultOwnerMode(false);
  }

  function handleScheduleSourceChange(source: "timeframe" | "manual") {
    if (source === scheduleSource) return;
    if (source === "timeframe" && days.length > 0) {
      setPendingScheduleSource(source);
      return;
    }
    applyScheduleSourceChange(source);
  }

  function applyScheduleSourceChange(source: "timeframe" | "manual") {
    setScheduleSource(source);
    if (source === "timeframe" && selectedTimeframe) {
      setDurationMinutes(String(selectedTimeframe.groupDurationMinutes));
    }
  }

  function handleTimeframeChange(value: string | null) {
    const nextId = value ?? "";
    setTimeframeId(nextId);
    const next = timeframes.find((item) => String(item.id) === nextId);
    if (next) setDurationMinutes(String(next.groupDurationMinutes));
  }

  function toggleRoomType(rt: RoomType) {
    setRoomTypes((prev) => {
      const next = new Set(prev);
      if (next.has(rt)) next.delete(rt);
      else next.add(rt);
      return next;
    });
  }

  function handleHeaderClickRange(date: string) {
    if (!pendingStart) {
      setPendingStart(date);
      return;
    }
    if (date === pendingStart) {
      setPendingStart(null);
      return;
    }
    if (date < pendingStart) {
      setPendingStart(date);
      setPendingEnd(null);
      return;
    }
    setPendingEnd(date);
    setConfirmOpen(true);
  }

  function confirmRange() {
    if (!pendingStart || !pendingEnd) return;
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
    setConfirmOpen(false);
    setPendingStart(null);
    setPendingEnd(null);
  }

  function cancelRangeConfirm() {
    setConfirmOpen(false);
    setPendingStart(null);
    setPendingEnd(null);
  }

  function resetRange() {
    setStartDate("");
    setEndDate("");
    setRegistrationDeadline(null);
    setDays([]);
    setPendingStart(null);
    setPendingEnd(null);
    setConfirmOpen(false);
  }

  function addSlot(date: string, startTime: string) {
    if (duration <= 0) return;
    const candidate = { startTime, endTime: addMinutes(startTime, duration) };
    setDays((prev) => {
      const existing = prev.find((d) => d.date === date);
      if (existing) {
        if (existing.slots.some((s) => slotsOverlap(s, candidate))) return prev;
        return prev
          .map((d) =>
            d.date === date
              ? {
                  ...d,
                  slots: [...d.slots, candidate].sort((a, b) =>
                    a.startTime.localeCompare(b.startTime),
                  ),
                }
              : d,
          )
          .sort((a, b) => a.date.localeCompare(b.date));
      }
      return [...prev, { date, slots: [candidate] }].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
    });
  }

  function removeSlot(date: string, index: number) {
    setDays((prev) =>
      prev
        .map((d) =>
          d.date === date
            ? { ...d, slots: d.slots.filter((_, i) => i !== index) }
            : d,
        )
        .filter((d) => d.slots.length > 0),
    );
  }

  const totalSlots = days.reduce((sum, d) => sum + d.slots.length, 0);
  const slotsValid = days.length >= 1 && days.every((d) => d.slots.length >= 1);

  const timeframeValid =
    scheduleSource === "timeframe" &&
    selectedTimeframe !== null &&
    timeframeId !== "" &&
    !timeframeDetailLoading &&
    !timeframeDetailError &&
    selectedTimeframe.groupDurationMinutes === duration;

  const step1Valid =
    name.trim() !== "" &&
    duration > 0 &&
    Number(reviewerCount) > 0 &&
    Number(maxGroupsPerTimeslot) > 0 &&
    roomTypes.size >= 1 &&
    (scheduleSource === "manual" || timeframeValid);

  const step2Valid =
    startDate !== "" &&
    endDate !== "" &&
    registrationDeadline != null &&
    (scheduleSource === "timeframe" ? timeframeValid : slotsValid);

  const payload: RoundCreatePayload | null = useMemo(() => {
    if (!step1Valid || !step2Valid || !registrationDeadline) return null;
    const dayInputs: RoundDayInput[] = days.map((d) => ({
      date: d.date,
      slots: d.slots,
    }));
    return buildRoundCreatePayload(
      {
        name,
        type,
        description: description || undefined,
        startDate,
        endDate,
        durationMinutes: duration,
        reviewerCount: Number(reviewerCount),
        maxGroupsPerTimeslot: Number(maxGroupsPerTimeslot),
        registrationDeadline: `${registrationDeadline.date}T${registrationDeadline.time}:00+07:00`,
        groupSelectionMode,
        resultOwnerMode: RESULT_OWNER_ALLOWED_TYPES.has(type) && resultOwnerMode,
        roomTypes: Array.from(roomTypes),
      },
      scheduleSource === "timeframe"
        ? { mode: "timeframe", timeframeId: Number(timeframeId) }
        : { mode: "manual", days: dayInputs },
    );
  }, [
    step1Valid,
    step2Valid,
    days,
    name,
    type,
    description,
    startDate,
    endDate,
    duration,
    reviewerCount,
    maxGroupsPerTimeslot,
    registrationDeadline,
    groupSelectionMode,
    resultOwnerMode,
    roomTypes,
    scheduleSource,
    timeframeId,
  ]);

  function handleSubmit() {
    if (!payload || !currentSemester?.id) return;
    createRound.mutate(payload, {
      onSuccess: (data) =>
        router.push(
          `/manager/rounds/${data.id}${currentSemesterId ? `?semester=${currentSemesterId}` : ""}`,
        ),
    });
  }

  const backHref = currentSemesterId
    ? `/manager/rounds?semester=${currentSemesterId}`
    : "/manager/rounds";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Các đợt đánh giá
            </Link>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Tạo đợt đánh giá
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Bước <span className="font-semibold text-foreground">{step}</span>/2
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: step === 1 ? "50%" : "100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </div>
      </header>

      {semesterNotFound && (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 md:px-8">
          <div className="mx-auto flex max-w-7xl items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-pretty">
              Không tìm thấy học kỳ{currentSemesterId ? ` "${currentSemesterId}"` : ""} —
              đây là lý do nút &ldquo;Tạo đợt đánh giá&rdquo; bị khoá. Hệ thống hiện chưa có học
              kỳ nào khớp mã này (có thể chưa tạo học kỳ, hoặc học kỳ đã bị xoá/đổi mã). Vào{" "}
              <Link href="/manager/semesters" className="font-medium underline underline-offset-2">
                Học kỳ
              </Link>{" "}
              để tạo hoặc chọn lại học kỳ hợp lệ.
            </p>
          </div>
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {step === 1 && (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
            <div className="shrink-0">
              <StepHeader
                icon={FileText}
                title="Thông tin đợt đánh giá"
                description="Tên, loại đợt, thông số buổi, loại phòng và Result Owner. Ngày & lịch chọn ở bước sau."
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="grid h-full md:grid-cols-2 md:divide-x md:divide-border lg:grid-cols-3">
                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="space-y-1.5">
                    <Label>Tên đợt</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Defense 1.1"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Loại đợt</Label>
                    <Select
                      value={type}
                      onValueChange={(v) =>
                        v && handleTypeChange(v as RoundType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: RoundType) => ROUND_TYPE_LABEL[v]}
                        </SelectValue>
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
                  <div className="space-y-1.5">
                    <Label>Mô tả (tùy chọn)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2.5 border-t border-border pt-4">
                    <div>
                      <Label>Nguồn tạo lịch</Label>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Chọn Timeframe để Backend tự sinh timeslot, hoặc nhập lịch thủ công như trước.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Nguồn tạo lịch">
                      {([
                        { value: "timeframe", label: "Dùng Timeframe", description: "Cấu hình dùng chung" },
                        { value: "manual", label: "Nhập thủ công", description: "Tự chọn từng slot" },
                      ] as const).map((option) => {
                        const selected = scheduleSource === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleScheduleSourceChange(option.value)}
                            className={cn(
                              "rounded-xl border p-3 text-left transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:bg-muted/50",
                            )}
                          >
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <span className={cn("flex size-6 items-center justify-center rounded-md", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                {option.value === "timeframe" ? <CalendarClock className="size-3.5" aria-hidden /> : <CalendarCheck className="size-3.5" aria-hidden />}
                              </span>
                              {option.label}
                            </span>
                            <span className="mt-1 block pl-8 text-xs text-muted-foreground">{option.description}</span>
                          </button>
                        );
                      })}
                    </div>
                    {scheduleSource === "timeframe" && (
                      <div className="space-y-2">
                        <Label htmlFor="round-timeframe">Timeframe</Label>
                        <Select value={timeframeId} onValueChange={handleTimeframeChange}>
                          <SelectTrigger id="round-timeframe" className="w-full" disabled={timeframesLoading || timeframesError || timeframes.length === 0}>
                            <SelectValue>
                              {(value: string) => {
                                const item = timeframes.find((timeframe) => String(timeframe.id) === value);
                                return item?.name ?? (timeframesLoading ? "Đang tải Timeframe…" : "Chọn Timeframe");
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {timeframes.map((timeframe) => (
                              <SelectItem key={timeframe.id} value={String(timeframe.id)}>
                                <span>{timeframe.name}</span>
                                <span className="text-xs text-muted-foreground">{timeframe.type}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {timeframesError && (
                          <p className="text-xs text-destructive">
                            Không tải được danh sách Timeframe. <button type="button" className="font-medium underline underline-offset-2" onClick={() => refetchTimeframes()}>Thử lại</button>
                          </p>
                        )}
                        {!timeframesLoading && !timeframesError && timeframes.length === 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Chưa có Timeframe đang dùng. Hãy <Link href="/manager/timeframes" className="font-medium underline underline-offset-2">tạo cấu hình trước</Link> hoặc chuyển sang nhập thủ công.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Timer className="size-3.5 shrink-0" aria-hidden />
                      Thông số buổi
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Thời lượng
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            className="bg-background pr-11"
                            disabled={scheduleSource === "timeframe"}
                            required
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                            phút
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Reviewer
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={reviewerCount}
                            onChange={(e) => setReviewerCount(e.target.value)}
                            className="bg-background pr-14"
                            required
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                            /buổi
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Nhóm tối đa
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            value={maxGroupsPerTimeslot}
                            onChange={(e) =>
                              setMaxGroupsPerTimeslot(e.target.value)
                            }
                            className="bg-background pr-14"
                            required
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                            /slot
                          </span>
                        </div>
                      </div>
                    </div>
                    {scheduleSource === "timeframe" && selectedTimeframe && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Thời lượng được lấy từ Timeframe: {selectedTimeframe.groupDurationMinutes} phút/nhóm.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Loại phòng cho phép</Label>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_TYPES.map((rt) => {
                        const active = roomTypes.has(rt);
                        return (
                          <button
                            key={rt}
                            type="button"
                            onClick={() => toggleRoomType(rt)}
                            aria-pressed={active}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted",
                            )}
                          >
                            <DoorOpen
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            {ROOM_TYPE_LABEL[rt]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto border-t border-border p-6 md:col-span-2 md:border-l-0 lg:col-span-1 lg:border-t-0 lg:border-l lg:border-border">
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                      groupSelectionMode
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        groupSelectionMode
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <CalendarCheck className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Nhóm tự chọn lịch</p>
                        <Switch
                          checked={groupSelectionMode}
                          onCheckedChange={setGroupSelectionMode}
                          aria-label="Nhóm tự chọn lịch"
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Leader chọn slot ưu tiên cho nhóm thay vì Manager xếp
                        toàn bộ.
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                      !RESULT_OWNER_ALLOWED_TYPES.has(type)
                        ? "border-border opacity-50"
                        : resultOwnerMode
                          ? "border-primary/40 bg-primary/5"
                          : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        resultOwnerMode && RESULT_OWNER_ALLOWED_TYPES.has(type)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Award className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          Chỉ định Result Owner
                        </p>
                        <Switch
                          checked={resultOwnerMode}
                          onCheckedChange={setResultOwnerMode}
                          disabled={!RESULT_OWNER_ALLOWED_TYPES.has(type)}
                          aria-label="Chỉ định Result Owner"
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {RESULT_OWNER_ALLOWED_TYPES.has(type)
                          ? "Một reviewer được chỉ định nhập kết quả chính thức cho buổi."
                          : "Chỉ áp dụng cho đợt Defense 1.1 / Defense 2."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex shrink-0 items-center justify-between gap-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5 shrink-0" aria-hidden />
                {roomTypes.size === 0
                  ? "Chọn ít nhất 1 loại phòng để tiếp tục."
                  : `${ROUND_TYPE_LABEL[type]} · ${roomTypes.size} loại phòng`}
              </p>
              <Button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Tiếp tục — chọn lịch
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
            <div className="shrink-0">
              <StepHeader
                icon={Settings2}
                title="Lịch đợt đánh giá"
                description={
                  scheduleSource === "timeframe"
                    ? "Chọn khoảng ngày và hạn đăng ký. Backend sẽ sinh timeslot từ Timeframe đã chọn."
                    : `Chọn khoảng ngày, hạn đăng ký chọn lịch và khung giờ ngay trên lịch. Mỗi khung giờ dài ${duration} phút.`
                }
              />
            </div>

            <div className="min-h-0 flex-1">
              {scheduleSource === "manual" ? (
                <RoundScheduleCalendar
                  duration={duration}
                  startDate={startDate}
                  endDate={endDate}
                  pendingStart={pendingStart}
                  pendingEnd={pendingEnd}
                  confirmOpen={confirmOpen}
                  onHeaderClickRange={handleHeaderClickRange}
                  onConfirmRange={confirmRange}
                  onCancelRangeConfirm={cancelRangeConfirm}
                  onResetRange={resetRange}
                  registrationDeadline={registrationDeadline}
                  onRegistrationDeadlineChange={setRegistrationDeadline}
                  days={days}
                  onAddSlot={addSlot}
                  onRemoveSlot={removeSlot}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3 sm:p-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="timeframe-round-start-date">Ngày bắt đầu</Label>
                      <Input id="timeframe-round-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="timeframe-round-end-date">Ngày kết thúc</Label>
                      <Input id="timeframe-round-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                      {startDate && endDate && startDate > endDate && <p className="text-xs text-destructive">Ngày kết thúc phải sau ngày bắt đầu.</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="timeframe-registration-deadline">Hạn đăng ký chọn lịch</Label>
                      <Input
                        id="timeframe-registration-deadline"
                        type="datetime-local"
                        value={registrationDeadline ? `${registrationDeadline.date}T${registrationDeadline.time}` : ""}
                        onChange={(event) => {
                          const [date, time] = event.target.value.split("T");
                          setRegistrationDeadline(date && time ? { date, time } : null);
                        }}
                        required
                      />
                    </div>
                  </div>
                  <RoundTimeframePreview
                    timeframe={selectedTimeframe}
                    isLoading={timeframeDetailLoading}
                    isError={timeframeDetailError}
                    onRetry={() => refetchTimeframe()}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    ← Sửa thông tin
                  </Button>
                  {scheduleSource === "manual" && days.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {days.length} ngày · {totalSlots} khung giờ
                    </p>
                  )}
                  {scheduleSource === "timeframe" && selectedTimeframe && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTimeframe.blocksPerDay} timeline/ngày · {selectedTimeframe.capacityPerDay} nhóm/ngày
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  disabled={
                    !payload || !currentSemester?.id || createRound.isPending
                  }
                  title={
                    semesterNotFound
                      ? `Không tìm thấy học kỳ${currentSemesterId ? ` "${currentSemesterId}"` : ""}`
                      : undefined
                  }
                  onClick={handleSubmit}
                >
                  {createRound.isPending ? "Đang tạo..." : "Tạo đợt đánh giá"}
                </Button>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <DoorOpen className="size-3.5 shrink-0" aria-hidden />
                Sau khi tạo, đợt ở trạng thái Nháp — vẫn có thể chỉnh sửa cấu
                hình trước khi mở đăng ký.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto mt-6 flex w-full max-w-5xl items-center gap-2 text-xs text-muted-foreground">
            <DoorOpen className="size-3.5 shrink-0" aria-hidden />
            Sau khi tạo, đợt ở trạng thái Nháp — vẫn có thể chỉnh sửa cấu hình
            trước khi mở đăng ký.
          </div>
        )}
      </main>

      <Dialog
        open={pendingScheduleSource !== null}
        onOpenChange={(open) => {
          if (!open) setPendingScheduleSource(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển sang dùng Timeframe?</DialogTitle>
            <DialogDescription>
              Các slot thủ công hiện tại sẽ tạm thời không được gửi khi tạo Round.
              Chúng vẫn được giữ trong form nếu bạn quay lại chế độ nhập thủ công.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingScheduleSource(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingScheduleSource) applyScheduleSourceChange(pendingScheduleSource);
                setPendingScheduleSource(null);
              }}
            >
              Dùng Timeframe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
