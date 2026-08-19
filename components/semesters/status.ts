import type { SemesterStatus } from "@/lib/api/services/fetchSemesters";

export const SEMESTER_STATUS_LABEL: Record<SemesterStatus, string> = {
  PLANNING: "Đang chuẩn bị",
  ACTIVE: "Đang hoạt động",
  CLOSED: "Đã đóng",
  ARCHIVED: "Đã lưu trữ",
};

export const SEMESTER_STATUS_DOT: Record<SemesterStatus, string> = {
  PLANNING: "bg-amber-500",
  ACTIVE: "bg-emerald-500",
  CLOSED: "bg-muted-foreground/60",
  ARCHIVED: "bg-muted-foreground/30",
};
