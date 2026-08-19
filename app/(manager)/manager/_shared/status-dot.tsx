import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "emerald" | "amber" | "orange" | "red" | "sky" | "violet";

const TONE_DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/40",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export function StatusDot({
  tone,
  label,
  className,
  pulse = false,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
  /** Nhấp nháy nhẹ để gợi ý trạng thái đang chờ hành động — dùng có chủ đích, không mặc định. */
  pulse?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className="relative flex size-1.5 shrink-0">
        {pulse && (
          <span
            className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden", TONE_DOT[tone])}
            aria-hidden
          />
        )}
        <span className={cn("relative size-1.5 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />
      </span>
      {label}
    </span>
  );
}
