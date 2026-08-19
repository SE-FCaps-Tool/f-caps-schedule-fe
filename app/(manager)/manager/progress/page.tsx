import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ProgressPage } from "./components/progress-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Tiến độ nhóm",
  path: "/manager/progress",
  noindex: true,
});

export default function ManagerProgressPage() {
  return <ProgressPage />;
}
