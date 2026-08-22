import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ConfigHub } from "@/components/master-data/config-hub";

export const metadata: Metadata = buildPageMetadata({
  title: "Cấu hình",
  path: "/manager/master-data",
  noindex: true,
});

export default function ManagerConfigPage() {
  return (
    <ConfigHub
      lecturersHref="/manager/lecturers"
      semestersHref="/manager/semesters"
      roomsHref="/manager/rooms"
      timeframesHref="/manager/timeframes"
      committeesHref="/manager/committees"
    />
  );
}
