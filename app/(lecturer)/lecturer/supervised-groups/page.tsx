import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SupervisedGroups } from "./components/supervised-groups";

export const metadata: Metadata = buildPageMetadata({
  title: "Nhóm hướng dẫn",
  path: "/lecturer/supervised-groups",
  noindex: true,
});

export default function SupervisedGroupsPage() {
  return <SupervisedGroups />;
}
