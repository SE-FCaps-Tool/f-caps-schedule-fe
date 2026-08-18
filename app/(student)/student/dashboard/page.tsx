import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { StudentDashboard } from "@/components/dashboard/student/student-dashboard";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan sinh viên",
  path: "/student/dashboard",
  noindex: true,
});

export default function StudentDashboardPage() {
  return <StudentDashboard />;
}
