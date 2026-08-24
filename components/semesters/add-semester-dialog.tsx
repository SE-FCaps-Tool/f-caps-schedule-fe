"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { CalendarPlus, Check, ChevronLeft, Leaf, Sprout, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateSemester } from "@/hooks/useSemesters";

const MIN_DURATION_DAYS = 105;
const MAX_DURATION_DAYS = 120;

type SeasonId = "SPRING" | "SUMMER" | "FALL";

interface SeasonDef {
  id: SeasonId;
  prefix: string;
  label: string;
  months: string;
  icon: typeof Sprout;
  tint: string;
  ring: string;
}

const SEASONS: SeasonDef[] = [
  {
    id: "SPRING",
    prefix: "SP",
    label: "Spring",
    months: "Jan – May",
    icon: Sprout,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
  },
  {
    id: "SUMMER",
    prefix: "SU",
    label: "Summer",
    months: "May – Aug",
    icon: Sun,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ring: "hover:border-amber-500/40 hover:bg-amber-500/5",
  },
  {
    id: "FALL",
    prefix: "FA",
    label: "Fall",
    months: "Sep – Dec",
    icon: Leaf,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-500/40 hover:bg-orange-500/5",
  },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const STEP_LABELS = ["Mùa", "Năm", "Xác nhận"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Trả về ISO date, hoặc null nếu ngày/tháng không hợp lệ trong năm đó (vd 30/02) */
function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function durationDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
  return diff;
}

const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }),
};

const reducedStepVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

function DateFieldRow({
  label,
  day,
  month,
  onDayChange,
  onMonthChange,
}: {
  label: string;
  day: number | null;
  month: number | null;
  onDayChange: (d: number) => void;
  onMonthChange: (m: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Ngày</span>
          <Select value={day ? String(day) : null} onValueChange={(v) => v && onDayChange(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Ngày {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Tháng</span>
          <Select value={month ? String(month) : null} onValueChange={(v) => v && onMonthChange(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="—">{(v: string | null) => (v ? `Th ${v}` : "—")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function AddSemesterDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);
  const [season, setSeason] = useState<SeasonId | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [startDay, setStartDay] = useState<number | null>(null);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [endDay, setEndDay] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const reduceMotion = useReducedMotion();
  const { mutate, isPending } = useCreateSemester();

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => currentYear + i);
  }, []);

  const seasonDef = season ? SEASONS.find((s) => s.id === season)! : null;
  const yy = year ? String(year).slice(-2) : "";
  const code = seasonDef ? `${seasonDef.prefix}${yy}` : "";
  const name = seasonDef && year ? `${seasonDef.label} ${year}` : "";

  const startDate = year && startDay && startMonth ? toIsoDate(year, startMonth, startDay) : null;
  const endDate = year && endDay && endMonth ? toIsoDate(year, endMonth, endDay) : null;
  const startInvalid = year !== null && startDay !== null && startMonth !== null && startDate === null;
  const endInvalid = year !== null && endDay !== null && endMonth !== null && endDate === null;

  const days = durationDays(startDate, endDate);
  const durationValid = days !== null && days >= MIN_DURATION_DAYS && days <= MAX_DURATION_DAYS;

  const canSave = Boolean(code && name && startDate && endDate && durationValid);

  function reset() {
    setStep(1);
    setDirection(1);
    setSeason(null);
    setYear(null);
    setStartDay(null);
    setStartMonth(null);
    setEndDay(null);
    setEndMonth(null);
    setNote("");
  }

  function goTo(next: 1 | 2 | 3) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function handleSelectSeason(id: SeasonId) {
    setSeason(id);
    goTo(2);
  }

  function handleSelectYear(y: number) {
    setYear(y);
    goTo(3);
  }

  function handleSave() {
    if (!canSave || !startDate || !endDate) return;
    mutate(
      { code, name, startDate, endDate, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      }
    );
  }

  const variants = reduceMotion ? reducedStepVariants : stepVariants;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button><CalendarPlus />Tạo học kỳ</Button>} />
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader icon={CalendarPlus} iconTone="violet">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="-ml-1.5"
                aria-label="Quay lại"
                onClick={() => goTo((step - 1) as 1 | 2)}
              >
                <ChevronLeft />
              </Button>
            )}
            <DialogTitle>Tạo học kỳ</DialogTitle>
          </div>
          <DialogDescription>
            Học kỳ mới luôn được tạo với trạng thái ACTIVE — chỉ được 1 học kỳ ACTIVE cùng lúc. Thời lượng phải từ{" "}
            {MIN_DURATION_DAYS}–{MAX_DURATION_DAYS} ngày.
          </DialogDescription>
          <div className="flex items-center gap-1.5 pt-1" aria-hidden>
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1.5">
                <span
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i + 1 <= step ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="relative min-h-64">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid grid-cols-3 gap-2.5"
              >
                {SEASONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSeason(s.id)}
                      className={cn(
                        "group flex flex-col items-center gap-3 rounded-xl border border-border py-7 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        s.ring
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-14 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
                          s.tint
                        )}
                      >
                        <Icon className="size-7" strokeWidth={1.5} />
                      </span>
                      <span>
                        <span className="block text-base font-semibold">{s.label}</span>
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">{s.months}</span>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 2 && seasonDef && (
              <motion.div key="step-2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
                <p className="mb-3 text-sm text-muted-foreground">
                  Chọn năm cho học kỳ <span className="font-medium text-foreground">{seasonDef.label}</span>
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border border-border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        seasonDef.ring
                      )}
                    >
                      <span>
                        <span className="block text-lg font-semibold tabular-nums">{y}</span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {seasonDef.prefix}
                          {String(y).slice(-2)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && seasonDef && year && (
              <motion.div key="step-3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", seasonDef.tint)}>
                    <seasonDef.icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium text-muted-foreground">{code}</p>
                    <p className="truncate text-sm font-semibold">{name}</p>
                  </div>
                  <Check className="ml-auto size-4 shrink-0 text-primary" aria-hidden />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DateFieldRow
                    label="Ngày bắt đầu"
                    day={startDay}
                    month={startMonth}
                    onDayChange={setStartDay}
                    onMonthChange={setStartMonth}
                  />
                  <DateFieldRow
                    label="Ngày kết thúc"
                    day={endDay}
                    month={endMonth}
                    onDayChange={setEndDay}
                    onMonthChange={setEndMonth}
                  />
                </div>

                {(startInvalid || endInvalid) && (
                  <p className="text-xs text-destructive">
                    {startInvalid ? "Ngày bắt đầu" : "Ngày kết thúc"} không hợp lệ với tháng đã chọn trong năm {year}.
                  </p>
                )}

                {!startInvalid && !endInvalid && days !== null && (
                  <p className={cn("text-xs", durationValid ? "text-muted-foreground" : "text-destructive")}>
                    {durationValid
                      ? `Thời lượng: ${days} ngày`
                      : `Thời lượng: ${days} ngày — phải từ ${MIN_DURATION_DAYS} đến ${MAX_DURATION_DAYS} ngày`}
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="semester-note">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="semester-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Capstone semester"
                    className="min-h-16"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 3 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={!canSave || isPending}>
              {isPending ? "Đang tạo..." : "Tạo học kỳ"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
