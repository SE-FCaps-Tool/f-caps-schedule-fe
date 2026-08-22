import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CommitteesPage } from "@/components/committees/committees-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Hội đồng",
  path: "/manager/committees",
  noindex: true,
});

export default function ManagerCommitteesPage() {
  return (
    <CommitteesPage
      backHref="/manager/master-data"
      backLabel="Cấu hình"
    />
  );
}
