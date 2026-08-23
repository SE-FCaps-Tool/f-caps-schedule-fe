"use client";

import { DateField } from "./date-field";
import { TimeField } from "./time-field";
import { cn } from "@/lib/utils";

/** Tách "YYYY-MM-DDTHH:mm" thành 2 phần; thiếu phần nào thì trả về mặc định của phần đó. */
function splitDateTime(value: string, fallbackTime: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) || fallbackTime };
}

/**
 * Cặp ngày + giờ dùng chung, thay cho `<input type="datetime-local">` (picker native, mỗi OS
 * một kiểu, không theo theme). Giá trị vào/ra vẫn là "YYYY-MM-DDTHH:mm" nên nơi gọi không phải
 * đổi state hay payload gửi BE.
 */
export function DateTimeField({
  id,
  value,
  onChange,
  ariaLabelDate,
  ariaLabelTime,
  /** Giờ điền sẵn khi người dùng mới chỉ chọn ngày. */
  defaultTime = "23:59",
  minDate,
  maxDate,
  disabled,
  className,
}: {
  id?: string;
  /** "YYYY-MM-DDTHH:mm", rỗng khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  ariaLabelDate: string;
  ariaLabelTime: string;
  defaultTime?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { date, time } = splitDateTime(value, defaultTime);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateField
        id={id}
        ariaLabel={ariaLabelDate}
        value={date}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        // Chọn ngày trước khi có giờ thì tự ghép `defaultTime` để giá trị luôn hợp lệ.
        onChange={(nextDate) => onChange(nextDate ? `${nextDate}T${time}` : "")}
        className="w-40"
      />
      <TimeField
        ariaLabel={ariaLabelTime}
        value={time}
        disabled={disabled || !date}
        onChange={(nextTime) => date && onChange(`${date}T${nextTime}`)}
        className="w-32"
      />
    </div>
  );
}
