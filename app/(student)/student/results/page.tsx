import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { StudentResultsStub } from "./components/student-results-stub";

export const metadata: Metadata = buildPageMetadata({
  title: "Kết quả",
  path: "/student/results",
  noindex: true,
});

export default function StudentResultsPage() {
  return <StudentResultsStub />;
}
