import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SemestersPage } from "./components/semesters-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Học kỳ",
  path: "/admin/master-data/semesters",
  noindex: true,
});

export default function AdminSemestersPage() {
  return <SemestersPage />;
}
