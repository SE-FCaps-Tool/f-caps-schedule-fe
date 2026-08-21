import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { TimeframesPage } from "@/components/master-data/timeframes-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Timeframe",
  path: "/admin/master-data/timeframes",
  noindex: true,
});

export default function AdminTimeframesPage() {
  return <TimeframesPage backHref="/admin/master-data" />;
}
