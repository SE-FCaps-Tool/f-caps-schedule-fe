import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AvailabilityRoundListPage } from "./components/availability-round-list-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Đăng ký lịch rảnh",
  path: "/lecturer/availability",
  noindex: true,
});

export default function LecturerAvailabilityPage() {
  return <AvailabilityRoundListPage />;
}
