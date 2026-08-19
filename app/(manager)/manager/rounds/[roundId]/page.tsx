import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoundDetailPage } from "./components/round-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Đợt đánh giá",
    path: `/manager/rounds/${roundId}`,
    noindex: true,
  });
}

export default async function ManagerRoundDetailPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <RoundDetailPage roundId={roundId} />;
}
