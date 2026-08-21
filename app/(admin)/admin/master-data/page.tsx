import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ConfigHub } from "@/components/master-data/config-hub";

export const metadata: Metadata = buildPageMetadata({
  title: "Cấu hình",
  path: "/admin/master-data",
  noindex: true,
});

export default function AdminConfigPage() {
  return (
    <ConfigHub
      lecturersHref="/admin/master-data/lecturers"
      semestersHref="/admin/master-data/semesters"
      roomsHref="/admin/master-data/rooms"
      timeframesHref="/admin/master-data/timeframes"
    />
  );
}
