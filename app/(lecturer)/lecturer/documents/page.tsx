import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = buildPageMetadata({
  title: "Tài liệu",
  path: "/lecturer/documents",
  noindex: true,
});

export default function LecturerDocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Tài liệu"
      description="Tài liệu hướng dẫn và biểu mẫu dành cho GVHD sẽ hiển thị ở đây."
    />
  );
}
