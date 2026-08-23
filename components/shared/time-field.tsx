"use client";

import { ChevronDown, Clock3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Mốc giờ hay dùng trong lịch học/đánh giá — bấm 1 phát thay vì xoay 2 dropdown. */
const TIME_PRESETS = ["07:00", "11:45", "12:00", "13:00", "17:30"];

export function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

export function splitTime(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return { hours, minutes };
}

function TimePartSelect({
  ariaLabel,
  label,
  value,
  count,
  onChange,
}: {
  ariaLabel: string;
  label: string;
  value: number;
  count: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {/* Select của dự án (Base UI) thay cho <select> thuần: popup theo theme, dùng được ở dark mode. */}
      <Select value={padTimePart(value)} onValueChange={(v) => v !== null && onChange(Number(v))}>
        <SelectTrigger size="sm" aria-label={ariaLabel} className="w-full font-medium tabular-nums">
          <SelectValue>{(v: string) => v}</SelectValue>
        </SelectTrigger>
        {/* alignItemWithTrigger mặc định = true khiến Base UI kéo popup sao cho item đang chọn
            đè lên trigger — với 24/60 dòng thì nó bị đẩy vọt lên khỏi ô. Tắt đi để xổ ngay dưới ô. */}
        <SelectContent align="start" alignItemWithTrigger={false} className="max-h-56">
          {Array.from({ length: count }, (_, part) => (
            <SelectItem key={part} value={padTimePart(part)} className="tabular-nums">
              {padTimePart(part)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Ô chọn giờ 24h dùng chung (cấu hình khung giờ, hạn đăng ký...). Chỉ là control — nhãn do
 * nơi gọi tự dựng, vì có chỗ đặt `<Label>` phía trên, có chỗ nhãn nằm inline trong câu.
 * Thay cho `<input type="time">`: input native mở picker của trình duyệt (có cột AM/PM,
 * không theo theme, mỗi OS một kiểu), còn cái này bám đúng design system.
 */
export function TimeField({
  id,
  value,
  onChange,
  ariaLabel,
  size = "default",
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Bắt buộc: nút chỉ hiện con số nên cần nhãn cho screen reader. */
  ariaLabel: string;
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
}) {
  const { hours, minutes } = splitTime(value);

  function updateTime(nextHours: number, nextMinutes: number) {
    onChange(`${padTimePart(nextHours)}:${padTimePart(nextMinutes)}`);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "flex items-center rounded-lg border border-input bg-transparent transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
              size === "sm" ? "h-7 gap-1.5 px-2 text-xs" : "h-10 w-full gap-2 px-3 text-sm",
              className,
            )}
          />
        }
      >
        <Clock3 className={cn("shrink-0 text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
        <span className={cn("text-left font-medium tabular-nums", size === "sm" ? "" : "flex-1")}>{value}</span>
        <ChevronDown className={cn("shrink-0 text-muted-foreground", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {/* Giá trị hiện tại đã nằm trên nút bấm nên không lặp lại trong popover. */}
        <div className="grid grid-cols-2 gap-2">
          <TimePartSelect
            ariaLabel={`${ariaLabel} - giờ`}
            label="Giờ"
            value={hours}
            count={24}
            onChange={(nextHours) => updateTime(nextHours, minutes)}
          />
          <TimePartSelect
            ariaLabel={`${ariaLabel} - phút`}
            label="Phút"
            value={minutes}
            count={60}
            onChange={(nextMinutes) => updateTime(hours, nextMinutes)}
          />
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">Mốc thường dùng</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs tabular-nums transition-colors",
                  // accent/accent-foreground là cặp cam nhạt + cam đậm của theme — đạt 4.56:1,
                  // khác với bg-primary/10 + text-primary (2.6:1, không đủ tương phản).
                  preset === value
                    ? "border-accent-foreground/25 bg-accent font-medium text-accent-foreground"
                    : "border-border text-foreground hover:bg-muted",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
