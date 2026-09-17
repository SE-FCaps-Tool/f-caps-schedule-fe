import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = buildPageMetadata({
  title: "Nhóm phản biện",
  path: "/lecturer/review-groups",
  noindex: true,
});

export default function LecturerReviewGroupsPage() {
  return (
    <ComingSoon
      icon={ClipboardCheck}
      title="Nhóm phản biện"
      description="Danh sách nhóm bạn được phân công phản biện sẽ hiển thị ở đây."
    />
  );
}
