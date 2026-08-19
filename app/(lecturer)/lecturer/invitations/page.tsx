import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { InvitationsPage } from "./components/invitations-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Lời mời tham gia",
  path: "/lecturer/invitations",
  noindex: true,
});

export default function LecturerInvitationsPage() {
  return <InvitationsPage />;
}
