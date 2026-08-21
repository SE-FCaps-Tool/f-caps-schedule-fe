import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { TimeframesPage } from "@/components/master-data/timeframes-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Timeframe",
  path: "/manager/timeframes",
  noindex: true,
});

export default function ManagerTimeframesPage() {
  return <TimeframesPage backHref="/manager/master-data" />;
}
