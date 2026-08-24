import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoundManualSchedulePage } from "./components/round-manual-schedule-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Xếp lịch",
    path: `/manager/rounds/${roundId}/manual-schedule`,
    noindex: true,
  });
}

export default async function ManagerRoundManualSchedulePage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <RoundManualSchedulePage roundId={roundId} />;
}
