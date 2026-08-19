import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AvailabilityFormPage } from "./components/availability-form-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Đăng ký lịch rảnh",
    path: `/lecturer/availability/${roundId}`,
    noindex: true,
  });
}

export default async function LecturerAvailabilityFormPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <AvailabilityFormPage roundId={roundId} />;
}
