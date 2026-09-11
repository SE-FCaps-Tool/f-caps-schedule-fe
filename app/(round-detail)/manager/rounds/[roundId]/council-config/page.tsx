import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CouncilConfigPage } from "./components/council-config-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Cấu hình Hội đồng",
    path: `/manager/rounds/${roundId}/council-config`,
    noindex: true,
  });
}

export default async function ManagerRoundCouncilConfigPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <CouncilConfigPage roundId={roundId} />;
}
