import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoomsPage } from "@/components/rooms/rooms-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Phòng",
  path: "/manager/rooms",
  noindex: true,
});

export default function ManagerRoomsPage() {
  return <RoomsPage />;
}
