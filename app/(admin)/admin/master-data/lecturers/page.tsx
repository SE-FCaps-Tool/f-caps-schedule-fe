import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LecturersPage } from "@/components/lecturers/lecturers-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Giảng viên",
  path: "/admin/master-data/lecturers",
  noindex: true,
});

export default function AdminLecturersPage() {
  return <LecturersPage backHref="/admin/master-data" backLabel="Cấu hình" />;
}
