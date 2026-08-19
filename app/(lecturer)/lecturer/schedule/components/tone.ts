import type { SessionStatus } from "@/types/models";

export type StatusTone = "neutral" | "primary" | "emerald" | "amber" | "red";

export const STATUS_META: Record<SessionStatus, { label: string; tone: StatusTone }> = {
  SCHEDULED: { label: "Sắp diễn ra", tone: "neutral" },
  ONGOING: { label: "Đang diễn ra", tone: "primary" },
  COMPLETED: { label: "Đã xong", tone: "emerald" },
  POSTPONED: { label: "Đã hoãn", tone: "amber" },
  CANCELLED: { label: "Đã huỷ", tone: "red" },
};

export const toneBadgeClass: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  red: "bg-destructive/10 text-destructive",
};

export const toneDotClass: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/40",
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

export const toneCardClass: Record<StatusTone, string> = {
  neutral: "bg-muted/70 text-foreground ring-1 ring-border hover:bg-muted",
  primary: "bg-primary text-primary-foreground ring-1 ring-primary hover:bg-primary/90",
  emerald:
    "bg-emerald-50 text-foreground ring-1 ring-emerald-200/70 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-50 dark:ring-emerald-400/20",
  amber:
    "bg-amber-50 text-foreground ring-1 ring-amber-200/70 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-50 dark:ring-amber-400/20",
  red: "bg-destructive/10 text-foreground ring-1 ring-destructive/20 hover:bg-destructive/15",
};
