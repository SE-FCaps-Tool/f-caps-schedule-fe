"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { vi } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";

/** "YYYY-MM-DD" → Date theo giờ địa phương. Dùng new Date("2026-08-23") sẽ ra UTC và lệch 1 ngày. */
function parseISODate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Date → "YYYY-MM-DD" theo giờ địa phương (toISOString sẽ lệch múi giờ). */
function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Nhãn thứ mặc định của locale vi là "Th 2".."CN" — quá dài cho ô lịch, dính vào nhau. */
const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Ô chọn ngày dùng chung, cặp với `TimeField` (cùng trigger, cùng popover, cùng bo góc/màu).
 * Thay cho `<input type="date">`: input native mở picker của trình duyệt — định dạng mm/dd/yyyy
 * theo locale máy, highlight xanh hệ thống, không theo theme và mỗi OS một kiểu.
 */
export function DateField({
  id,
  value,
  onChange,
  ariaLabel,
  min,
  max,
  size = "default",
  disabled,
  className,
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  /** "YYYY-MM-DD", rỗng khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  /** Bắt buộc: nút chỉ hiện ngày nên cần nhãn cho screen reader. */
  ariaLabel: string;
  /** "YYYY-MM-DD" — ngoài khoảng thì không bấm được. */
  min?: string;
  max?: string;
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
}) {
  const selected = value ? parseISODate(value) : undefined;
  const minDate = min ? parseISODate(min) : undefined;
  const maxDate = max ? parseISODate(max) : undefined;
  const today = startOfToday();
  const todayOutOfRange = (minDate && today < minDate) || (maxDate && today > maxDate);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "flex items-center rounded-lg border border-input bg-transparent transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
              size === "sm" ? "h-7 gap-1.5 px-2 text-xs" : "h-10 w-full gap-2 px-3 text-sm",
              className,
            )}
          />
        }
      >
        <CalendarDays
          className={cn("shrink-0 text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")}
          aria-hidden
        />
        <span
          className={cn(
            "text-left font-medium tabular-nums",
            size === "sm" ? "" : "flex-1",
            !value && "font-normal text-muted-foreground",
          )}
        >
          {value ? formatDate(value, "DD/MM/YYYY") : "Chọn ngày"}
        </span>
        <ChevronDown
          className={cn("shrink-0 text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")}
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="single"
          locale={vi}
          selected={selected}
          defaultMonth={selected ?? minDate ?? today}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
          onSelect={(date) => date && onChange(toISODate(date))}
          formatters={{ formatWeekdayName: (day) => WEEKDAY_LABELS[day.getDay()] }}
          className="p-0 [--cell-size:--spacing(8)]"
        />

        {/* Cùng vai trò với hàng "Mốc thường dùng" của TimeField — nhảy nhanh, không phải lật tháng. */}
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            disabled={todayOutOfRange}
            onClick={() => onChange(toISODate(today))}
            className={cn(
              "rounded-md border px-2 py-1 text-xs tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              // Cùng cặp accent/accent-foreground với TimeField — đạt 4.56:1, khác bg-primary/10 + text-primary (2.6:1).
              value === toISODate(today)
                ? "border-accent-foreground/25 bg-accent font-medium text-accent-foreground"
                : "border-border text-foreground hover:bg-muted",
            )}
          >
            Hôm nay · {formatDate(toISODate(today), "DD/MM")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
