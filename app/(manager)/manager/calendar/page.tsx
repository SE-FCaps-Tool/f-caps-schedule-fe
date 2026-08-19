import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CalendarPage } from "./components/calendar-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Lịch đánh giá",
  path: "/manager/calendar",
  noindex: true,
});

export default function ManagerCalendarPage() {
  return <CalendarPage />;
}
