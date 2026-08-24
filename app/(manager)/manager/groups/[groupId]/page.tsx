import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { GroupDetailPage } from "./components/group-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const { groupId } = await params;
  return buildPageMetadata({
    title: "Chi tiết nhóm",
    path: `/manager/groups/${groupId}`,
    noindex: true,
  });
}

export default async function ManagerGroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  if (!groupId) notFound();

  return <GroupDetailPage groupId={groupId} />;
}
