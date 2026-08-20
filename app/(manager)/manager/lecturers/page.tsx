import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LecturersPage } from "@/components/lecturers/lecturers-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Giảng viên",
  path: "/manager/lecturers",
  noindex: true,
});

export default function ManagerLecturersPage() {
  return <LecturersPage backHref="/manager/master-data" backLabel="Cấu hình" />;
}
