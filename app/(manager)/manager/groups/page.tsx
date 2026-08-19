import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { GroupsPage } from "./components/groups-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Nhóm sinh viên",
  path: "/manager/groups",
  noindex: true,
});

export default function ManagerGroupsPage() {
  return <GroupsPage />;
}
