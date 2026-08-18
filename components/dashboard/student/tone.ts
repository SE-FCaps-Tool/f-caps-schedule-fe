import type { ResultTone } from "./mock-data";

export const toneBadgeClass: Record<ResultTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  orange: "bg-primary/10 text-primary",
  red: "bg-destructive/10 text-destructive",
  sky: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300",
};

export const toneDotClass: Record<ResultTone, string> = {
  neutral: "bg-muted-foreground/40",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-primary",
  red: "bg-destructive",
  sky: "bg-sky-500",
};

export const toneTextClass: Record<ResultTone, string> = {
  neutral: "text-muted-foreground",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-800 dark:text-amber-300",
  orange: "text-primary",
  red: "text-destructive",
  sky: "text-sky-800 dark:text-sky-300",
};
