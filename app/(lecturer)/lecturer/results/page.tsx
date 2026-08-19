import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LecturerResults } from "./components/lecturer-results";

export const metadata: Metadata = buildPageMetadata({
  title: "Nhập kết quả",
  path: "/lecturer/results",
  noindex: true,
});

export default function LecturerResultsPage() {
  return <LecturerResults />;
}
