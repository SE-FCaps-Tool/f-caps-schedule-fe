import dayjs from "dayjs";
import "dayjs/locale/vi";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.locale("vi");
dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Format an API instant in the product timezone without depending on the browser timezone. */
export function formatInVietnamTime(date: string | Date, format: string): string {
  return dayjs(date).tz(VIETNAM_TIME_ZONE).format(format);
}

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
