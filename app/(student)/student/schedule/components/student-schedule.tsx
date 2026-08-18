import { ScheduleCalendar } from "./schedule-calendar";
import { studentScheduleData } from "./mock-data";

export function StudentSchedule() {
  return <ScheduleCalendar data={studentScheduleData} />;
}
