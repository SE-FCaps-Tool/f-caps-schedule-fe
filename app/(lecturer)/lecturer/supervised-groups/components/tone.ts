import type { StatusTone } from "../../_shared/status-dot";

export const toneBadgeClass: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  orange: "bg-primary/10 text-primary",
  red: "bg-destructive/10 text-destructive",
  sky: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
  violet: "bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300",
};

export const toneDotClass: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/40",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-primary",
  red: "bg-destructive",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};
