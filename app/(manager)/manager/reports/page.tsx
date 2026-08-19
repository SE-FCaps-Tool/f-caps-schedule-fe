import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ReportsPage } from "./components/reports-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Báo cáo",
  path: "/manager/reports",
  noindex: true,
});

export default function ManagerReportsPage() {
  return <ReportsPage />;
}
