import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LecturerSchedule } from "./components/lecturer-schedule";

export const metadata: Metadata = buildPageMetadata({
  title: "Lịch của tôi",
  path: "/lecturer/schedule",
  noindex: true,
});

export default function LecturerSchedulePage() {
  return <LecturerSchedule />;
}
