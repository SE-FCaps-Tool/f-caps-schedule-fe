import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

// Múi giờ chuẩn Asia/Bangkok (UTC+7) — PRD mục 9
export function formatDate(date: string | Date, format = "DD/MM/YYYY"): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format("HH:mm")} – ${dayjs(endTime).format("HH:mm")}`;
}
