import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoomsPage } from "@/components/rooms/rooms-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Phòng",
  path: "/admin/master-data/rooms",
  noindex: true,
});

export default function AdminRoomsPage() {
  return <RoomsPage backHref="/admin/master-data" backLabel="Cấu hình" />;
}
