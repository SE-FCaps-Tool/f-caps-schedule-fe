import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LecturerDashboard } from "./components/lecturer-dashboard";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan giảng viên",
  path: "/lecturer/dashboard",
  noindex: true,
});

export default function LecturerDashboardPage() {
  return <LecturerDashboard />;
}
