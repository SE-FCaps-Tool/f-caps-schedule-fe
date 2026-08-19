import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PreferenceFormPage } from "./components/preference-form-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Chọn khung giờ",
    path: `/student/preferences/${roundId}`,
    noindex: true,
  });
}

export default async function StudentPreferenceRoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <PreferenceFormPage roundId={roundId} />;
}
