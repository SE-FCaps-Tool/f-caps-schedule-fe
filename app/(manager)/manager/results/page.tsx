import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ResultsPage } from "./components/results-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Kết quả & khắc phục",
  path: "/manager/results",
  noindex: true,
});

export default function ManagerResultsPage() {
  return <ResultsPage />;
}
