"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  DoorOpen,
  FileText,
  Plus,
  Settings2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";
import { ROUND_TYPE_LABEL } from "../../../_shared/labels";
import { useSemesterContext } from "../../../_shared/semester-context";
import { useCreateRound } from "@/hooks/manager/useRounds";
import type {
  RoomType,
  RoundCreatePayload,
  RoundDayInput,
  RoundType,
} from "@/lib/api/services/fetchRounds";
import { RoundWizardShell } from "./round-wizard-shell";
import { IconDateInput } from "./icon-date-input";

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

const STEP_LABELS = [
  "Thông tin",
  "Ngày & Timeslot",
  "Registration + Room Type",
  "Xác nhận",
];

const stepVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -28 : 28, opacity: 0 }),
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

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
  icon: LucideIcon;
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

interface DayDraft {
  date: string;
  slots: { startTime: string; endTime: string }[];
}

export function CreateRoundWizard() {
  const router = useRouter();
  const { currentSemester } = useSemesterContext();
  const createRound = useCreateRound(currentSemester?.id);
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [name, setName] = useState("");
  const [type, setType] = useState<RoundType>("REVIEW_1");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [reviewerCount, setReviewerCount] = useState(
    String(DEFAULT_REVIEWER_COUNT.REVIEW_1),
  );
  const [maxGroupsPerTimeslot, setMaxGroupsPerTimeslot] = useState("3");

  // Step 2
  const [days, setDays] = useState<DayDraft[]>([]);
  const [newDayDate, setNewDayDate] = useState("");
  const [slotStart, setSlotStart] = useState("08:00");

  // Step 3
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [groupSelectionMode, setGroupSelectionMode] = useState(false);
  const [groupPreferenceDeadline, setGroupPreferenceDeadline] = useState("");
  const [resultOwnerMode, setResultOwnerMode] = useState(false);
  const [roomTypes, setRoomTypes] = useState<Set<RoomType>>(new Set());

  const duration = Number(durationMinutes) || 0;

  function handleTypeChange(v: RoundType) {
    setType(v);
    setReviewerCount(String(DEFAULT_REVIEWER_COUNT[v]));
    if (!RESULT_OWNER_ALLOWED_TYPES.has(v)) setResultOwnerMode(false);
  }

  function addDay() {
    if (!newDayDate || days.some((d) => d.date === newDayDate)) return;
    setDays((prev) =>
      [...prev, { date: newDayDate, slots: [] }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    );
    setNewDayDate("");
  }

  function removeDay(date: string) {
    setDays((prev) => prev.filter((d) => d.date !== date));
  }

  function addSlot(date: string) {
    if (!slotStart || duration <= 0) return;
    const candidate = {
      startTime: slotStart,
      endTime: addMinutes(slotStart, duration),
    };
    if (candidate.endTime <= candidate.startTime) return;
    setDays((prev) =>
      prev.map((d) => {
        if (d.date !== date) return d;
        if (d.slots.some((s) => slotsOverlap(s, candidate))) return d;
        return {
          ...d,
          slots: [...d.slots, candidate].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          ),
        };
      }),
    );
  }

  function removeSlot(date: string, index: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.date === date
          ? { ...d, slots: d.slots.filter((_, i) => i !== index) }
          : d,
      ),
    );
  }

  function toggleRoomType(rt: RoomType) {
    setRoomTypes((prev) => {
      const next = new Set(prev);
      if (next.has(rt)) next.delete(rt);
      else next.add(rt);
      return next;
    });
  }

  const step1Valid =
    name.trim() !== "" &&
    duration > 0 &&
    Number(reviewerCount) > 0 &&
    Number(maxGroupsPerTimeslot) > 0;
  const step2Valid = days.length >= 1 && days.every((d) => d.slots.length >= 1);
  const step3Valid =
    registrationDeadline !== "" &&
    roomTypes.size >= 1 &&
    (!groupSelectionMode || groupPreferenceDeadline !== "");

  const payload: RoundCreatePayload | null = useMemo(() => {
    if (!step1Valid || !step2Valid || !step3Valid) return null;
    const dayInputs: RoundDayInput[] = days.map((d) => ({
      date: d.date,
      slots: d.slots,
    }));
    return {
      name,
      type,
      description: description || undefined,
      durationMinutes: duration,
      reviewerCount: Number(reviewerCount),
      maxGroupsPerTimeslot: Number(maxGroupsPerTimeslot),
      registrationDeadline: `${registrationDeadline}:00+07:00`,
      groupSelectionMode,
      groupPreferenceDeadline: groupSelectionMode
        ? `${groupPreferenceDeadline}:00+07:00`
        : undefined,
      resultOwnerMode: RESULT_OWNER_ALLOWED_TYPES.has(type) && resultOwnerMode,
      roomTypes: Array.from(roomTypes),
      days: dayInputs,
    };
  }, [
    step1Valid,
    step2Valid,
    step3Valid,
    days,
    name,
    type,
    description,
    duration,
    reviewerCount,
    maxGroupsPerTimeslot,
    registrationDeadline,
    groupSelectionMode,
    groupPreferenceDeadline,
    resultOwnerMode,
    roomTypes,
  ]);

  function handleSubmit() {
    if (!payload) return;
    createRound.mutate(payload, {
      onSuccess: (data) => router.push(`/manager/rounds/${data.id}`),
    });
  }

  const canGoNext =
    step === 1
      ? step1Valid
      : step === 2
        ? step2Valid
        : step === 3
          ? step3Valid
          : true;

  function goNext() {
    if (step === 4) {
      handleSubmit();
      return;
    }
    if (!canGoNext) return;
    setDirection(1);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    if (step === 1) return;
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  }

  const formRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    // Không chặn Enter đang được base-ui Select dùng để chọn item trong popover.
    if (
      target.closest("[role='listbox']") ||
      target.closest("[data-slot='select-content']")
    )
      return;
    e.preventDefault();
    goNext();
  }

  return (
    <RoundWizardShell
      title="Tạo đợt đánh giá"
      cancelHref="/manager/rounds"
      stepLabels={STEP_LABELS}
      step={step}
      canGoBack={step > 1}
      canGoNext={canGoNext}
      onBack={goBack}
      onNext={goNext}
      nextLabel={
        step === 4
          ? createRound.isPending
            ? "Đang tạo..."
            : "Tạo đợt đánh giá"
          : "Tiếp tục"
      }
      isSubmitting={createRound.isPending}
    >
      <div ref={formRef} onKeyDown={handleKeyDown}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={reduceMotion ? undefined : stepVariants}
            initial={reduceMotion ? undefined : "enter"}
            animate={reduceMotion ? undefined : "center"}
            exit={reduceMotion ? undefined : "exit"}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && (
              <div>
                <StepHeader
                  icon={FileText}
                  title="Thông tin đợt đánh giá"
                  description="Đặt tên, chọn loại đợt và các thông số cơ bản áp dụng cho toàn bộ buổi."
                />
                <div className="space-y-5">
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
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Thời lượng (phút)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Số reviewer / buổi</Label>
                      <Input
                        type="number"
                        min={1}
                        value={reviewerCount}
                        onChange={(e) => setReviewerCount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nhóm tối đa / timeslot</Label>
                      <Input
                        type="number"
                        min={1}
                        value={maxGroupsPerTimeslot}
                        onChange={(e) =>
                          setMaxGroupsPerTimeslot(e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeader
                  icon={CalendarDays}
                  title="Ngày & timeslot"
                  description={`Mỗi slot dài ${duration || 0} phút, tự tính giờ kết thúc theo thời lượng ở bước 1.`}
                />
                <div className="space-y-5">
                  <div className="flex items-end gap-2">
                    <div className="space-y-1.5">
                      <Label>Thêm ngày</Label>
                      <IconDateInput
                        icon={CalendarDays}
                        type="date"
                        value={newDayDate}
                        onChange={(e) => setNewDayDate(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDay}
                      disabled={!newDayDate}
                    >
                      <Plus />
                      Thêm ngày
                    </Button>
                  </div>

                  {days.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                      <CalendarDays
                        className="size-6 text-muted-foreground/50"
                        aria-hidden
                      />
                      <p className="text-sm text-muted-foreground">
                        Chưa có ngày nào — thêm ngày đầu tiên ở trên.
                      </p>
                    </div>
                  )}

                  <motion.div
                    variants={reduceMotion ? undefined : listVariants}
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "show"}
                    className="space-y-4"
                  >
                    <AnimatePresence initial={false}>
                      {days.map((day) => (
                        <motion.div
                          key={day.date}
                          layout
                          variants={reduceMotion ? undefined : listItemVariants}
                          initial={reduceMotion ? undefined : "hidden"}
                          animate={reduceMotion ? undefined : "show"}
                          exit={reduceMotion ? undefined : "exit"}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">
                              {formatDate(day.date, "dddd, DD/MM/YYYY")}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeDay(day.date)}
                              aria-label={`Xoá ngày ${day.date}`}
                            >
                              <Trash2 />
                            </Button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <AnimatePresence initial={false}>
                              {day.slots.map((slot, index) => (
                                <motion.span
                                  key={`${slot.startTime}-${index}`}
                                  layout
                                  initial={
                                    reduceMotion
                                      ? undefined
                                      : { opacity: 0, scale: 0.85 }
                                  }
                                  animate={
                                    reduceMotion
                                      ? undefined
                                      : { opacity: 1, scale: 1 }
                                  }
                                  exit={
                                    reduceMotion
                                      ? undefined
                                      : { opacity: 0, scale: 0.85 }
                                  }
                                  transition={{ duration: 0.15 }}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs tabular-nums"
                                >
                                  {slot.startTime} – {slot.endTime}
                                  <button
                                    type="button"
                                    onClick={() => removeSlot(day.date, index)}
                                    aria-label="Xoá slot"
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </motion.span>
                              ))}
                            </AnimatePresence>
                            {day.slots.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                Chưa có slot.
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-end gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Giờ bắt đầu slot
                              </Label>
                              <IconDateInput
                                icon={Clock}
                                type="time"
                                value={slotStart}
                                onChange={(e) => setSlotStart(e.target.value)}
                                className="w-36"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSlot(day.date)}
                              disabled={duration <= 0}
                            >
                              <Plus />
                              Thêm slot
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeader
                  icon={Settings2}
                  title="Đăng ký & loại phòng"
                  description="Cấu hình hạn đăng ký, chế độ chọn lịch của nhóm và loại phòng được phép sử dụng."
                />
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Hạn đăng ký</Label>
                    <IconDateInput
                      icon={CalendarClock}
                      type="datetime-local"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">Nhóm tự chọn lịch</p>
                      <p className="text-xs text-muted-foreground">
                        Leader chọn slot ưu tiên cho nhóm thay vì Manager xếp
                        toàn bộ.
                      </p>
                    </div>
                    <Switch
                      checked={groupSelectionMode}
                      onCheckedChange={setGroupSelectionMode}
                      aria-label="Nhóm tự chọn lịch"
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {groupSelectionMode && (
                      <motion.div
                        initial={
                          reduceMotion ? undefined : { opacity: 0, height: 0 }
                        }
                        animate={
                          reduceMotion
                            ? undefined
                            : { opacity: 1, height: "auto" }
                        }
                        exit={
                          reduceMotion ? undefined : { opacity: 0, height: 0 }
                        }
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <Label>Hạn chọn lịch của nhóm</Label>
                        <IconDateInput
                          icon={CalendarClock}
                          type="datetime-local"
                          value={groupPreferenceDeadline}
                          onChange={(e) =>
                            setGroupPreferenceDeadline(e.target.value)
                          }
                          required
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-border p-3",
                      !RESULT_OWNER_ALLOWED_TYPES.has(type) && "opacity-50",
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Chỉ định Result Owner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {RESULT_OWNER_ALLOWED_TYPES.has(type)
                          ? "Một reviewer được chỉ định nhập kết quả chính thức cho buổi."
                          : "Chỉ áp dụng cho đợt Defense 1.1 / Defense 2."}
                      </p>
                    </div>
                    <Switch
                      checked={resultOwnerMode}
                      onCheckedChange={setResultOwnerMode}
                      disabled={!RESULT_OWNER_ALLOWED_TYPES.has(type)}
                      aria-label="Chỉ định Result Owner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Loại phòng cho phép</Label>
                    <div className="space-y-2">
                      {ROOM_TYPES.map((rt) => (
                        <label
                          key={rt}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <Checkbox
                            checked={roomTypes.has(rt)}
                            onCheckedChange={() => toggleRoomType(rt)}
                          />
                          {ROOM_TYPE_LABEL[rt]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeader
                  icon={FileText}
                  title="Xác nhận & tạo đợt"
                  description="Kiểm tra lại toàn bộ thông tin trước khi tạo — sau khi tạo vẫn có thể chỉnh sửa cấu hình."
                />
                <div className="overflow-hidden rounded-xl border border-border text-sm">
                  <div className="flex items-start gap-3 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {name || "—"}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {ROUND_TYPE_LABEL[type]}
                      </p>
                      {description && (
                        <p className="mt-2 text-muted-foreground text-pretty">
                          {description}
                        </p>
                      )}
                      <dl className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Thời lượng
                          </dt>
                          <dd className="tabular-nums font-medium text-foreground">
                            {duration} phút
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Reviewer / buổi
                          </dt>
                          <dd className="tabular-nums font-medium text-foreground">
                            {reviewerCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Nhóm tối đa / timeslot
                          </dt>
                          <dd className="tabular-nums font-medium text-foreground">
                            {maxGroupsPerTimeslot}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-border p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {days.length} ngày ·{" "}
                        {days.reduce((sum, d) => sum + d.slots.length, 0)} slot
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {days.map((d) => (
                          <li
                            key={d.date}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                          >
                            <span className="font-medium text-foreground capitalize">
                              {formatDate(d.date, "dddd, DD/MM")}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {d.slots
                                .map((s) => `${s.startTime}–${s.endTime}`)
                                .join(", ") || "chưa có slot"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-border p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Settings2 className="size-4.5" />
                    </span>
                    <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Hạn đăng ký
                        </dt>
                        <dd className="font-medium text-foreground">
                          {registrationDeadline
                            ? formatDate(
                                registrationDeadline,
                                "HH:mm, DD/MM/YYYY",
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Nhóm tự chọn lịch
                        </dt>
                        <dd className="font-medium text-foreground">
                          {groupSelectionMode ? "Bật" : "Tắt"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Result Owner
                        </dt>
                        <dd className="font-medium text-foreground">
                          {resultOwnerMode ? "Bật" : "Tắt"}
                        </dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DoorOpen className="size-3" />
                          Loại phòng
                        </dt>
                        <dd className="font-medium text-foreground">
                          {Array.from(roomTypes)
                            .map((rt) => ROOM_TYPE_LABEL[rt])
                            .join(", ") || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </RoundWizardShell>
  );
}
