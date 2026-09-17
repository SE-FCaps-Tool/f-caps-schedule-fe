import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = buildPageMetadata({
  title: "Checklist",
  path: "/lecturer/checklist",
  noindex: true,
});

export default function LecturerChecklistPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Checklist"
      description="Checklist phản biện của bạn sẽ hiển thị ở đây."
    />
  );
}
