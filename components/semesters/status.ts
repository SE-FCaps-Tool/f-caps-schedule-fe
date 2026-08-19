import type { SemesterStatus } from "@/lib/api/services/fetchSemesters";

export const SEMESTER_STATUS_LABEL: Record<SemesterStatus, string> = {
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang hoạt động",
  CLOSED: "Đã đóng",
};

export const SEMESTER_STATUS_DOT: Record<SemesterStatus, string> = {
  UPCOMING: "bg-amber-500",
  ACTIVE: "bg-emerald-500",
  CLOSED: "bg-muted-foreground/60",
};
