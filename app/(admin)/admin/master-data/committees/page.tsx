import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CommitteesPage } from "@/components/committees/committees-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Hội đồng",
  path: "/admin/master-data/committees",
  noindex: true,
});

export default function AdminCommitteesPage() {
  return (
    <CommitteesPage
      backHref="/admin/master-data"
      backLabel="Cấu hình"
    />
  );
}
