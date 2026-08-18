import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { StudentSchedule } from "./components/student-schedule";

export const metadata: Metadata = buildPageMetadata({
  title: "Lịch nhóm sinh viên",
  path: "/student/schedule",
  noindex: true,
});

export default function StudentSchedulePage() {
  return <StudentSchedule />;
}
