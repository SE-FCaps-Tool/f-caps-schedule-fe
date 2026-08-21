import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { EditRoundConfigPage } from "./components/edit-round-config-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Chỉnh sửa cấu hình đợt đánh giá",
    path: `/manager/rounds/${roundId}/edit`,
    noindex: true,
  });
}

export default async function ManagerEditRoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <EditRoundConfigPage roundId={roundId} />;
}
