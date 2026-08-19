import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoundsPage } from "./components/rounds-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Các đợt đánh giá",
  path: "/manager/rounds",
  noindex: true,
});

export default function ManagerRoundsPage() {
  return <RoundsPage />;
}
