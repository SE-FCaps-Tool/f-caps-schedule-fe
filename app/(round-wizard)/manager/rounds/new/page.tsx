import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CreateRoundWizard } from "./components/create-round-wizard";

export const metadata: Metadata = buildPageMetadata({
  title: "Tạo đợt đánh giá",
  path: "/manager/rounds/new",
  noindex: true,
});

export default function ManagerCreateRoundPage() {
  return <CreateRoundWizard />;
}
