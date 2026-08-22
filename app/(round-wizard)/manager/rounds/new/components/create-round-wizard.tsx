"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  CalendarCheck,
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
import type {
  RoomType,
  RoundCreatePayload,
  RoundDayInput,
  RoundType,
} from "@/lib/api/services/fetchRounds";
import {
  RoundScheduleCalendar,
  type DayDraft,
  type DeadlineDraft,
} from "./round-schedule-calendar";

const ROUND_TYPES: RoundType[] = [
  "REVIEW_1",
  "REVIEW_2",
  "REVIEW_3",
  "DEFENSE_1",
  "DEFENSE_2",
];

/**
 * BE chỉ chấp nhận resultOwnerMode=true cho REVIEW_3/DEFENSE_2 (422 nếu không).
 */
const RESULT_OWNER_ALLOWED_TYPES = new Set<RoundType>([
  "REVIEW_3",
  "DEFENSE_2",
]);

/** Mặc định reviewer/buổi theo loại đợt — spec §20 Step 1 */
const DEFAULT_REVIEWER_COUNT: Record<RoundType, number> = {
  REVIEW_1: 2,
  REVIEW_2: 2,
  REVIEW_3: 3,
  DEFENSE_1: 5,
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

  // Bước 2 — lịch
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] =
    useState<DeadlineDraft | null>(null);
  const [days, setDays] = useState<DayDraft[]>([]);

  const duration = Number(durationMinutes) || 0;

  function handleTypeChange(v: RoundType) {
    setType(v);
    setReviewerCount(String(DEFAULT_REVIEWER_COUNT[v]));
    if (!RESULT_OWNER_ALLOWED_TYPES.has(v)) setResultOwnerMode(false);
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

  const step1Valid =
    name.trim() !== "" &&
    duration > 0 &&
    Number(reviewerCount) > 0 &&
    Number(maxGroupsPerTimeslot) > 0 &&
    roomTypes.size >= 1;

  const totalSlots = days.reduce((sum, d) => sum + d.slots.length, 0);
  const slotsValid = days.length >= 1 && days.every((d) => d.slots.length >= 1);

  const step2Valid =
    startDate !== "" &&
    endDate !== "" &&
    registrationDeadline != null &&
    slotsValid;

  const payload: RoundCreatePayload | null = useMemo(() => {
    if (!step1Valid || !step2Valid || !registrationDeadline) return null;
    const dayInputs: RoundDayInput[] = days.map((d) => ({
      date: d.date,
      slots: d.slots,
    }));
    return {
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
      days: dayInputs,
    };
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
                      placeholder="Review 3"
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
                          : "Chỉ áp dụng cho đợt Review 3 / Defense 2."}
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
                description={`Chọn khoảng ngày, hạn đăng ký chọn lịch và khung giờ ngay trên lịch. Mỗi khung giờ dài ${duration} phút.`}
              />
            </div>

            <div className="min-h-0 flex-1">
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
                  {days.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {days.length} ngày · {totalSlots} khung giờ
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
    </div>
  );
}
