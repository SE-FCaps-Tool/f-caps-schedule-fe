import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SemestersPage } from "./components/semesters-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Học kỳ",
  path: "/manager/semesters",
  noindex: true,
});

export default function ManagerSemestersPage() {
  return <SemestersPage backHref="/manager/master-data" backLabel="Cấu hình" />;
}
