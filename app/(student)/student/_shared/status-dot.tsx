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

export const toneBadgeClass: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  orange: "bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-300",
  red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  sky: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
  violet: "bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300",
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
