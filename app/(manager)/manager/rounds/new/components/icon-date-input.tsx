"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Wrapper cho input date/time/datetime-local: icon riêng đồng bộ design system
 * thay cho icon mặc định của trình duyệt (che bằng opacity trên
 * ::-webkit-calendar-picker-indicator, mở rộng vùng bấm ra toàn field).
 * Firefox không hỗ trợ pseudo-element này nên sẽ vẫn hiện icon gốc song song —
 * suy giảm nhẹ, chấp nhận được vì đây là công cụ nội bộ dùng chủ yếu trên Chrome/Edge.
 */
export function IconDateInput({
  icon: Icon,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Input
        {...props}
        className={cn(
          "pr-10 [color-scheme:light] dark:[color-scheme:dark]",
          "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
          className
        )}
      />
      <Icon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}
