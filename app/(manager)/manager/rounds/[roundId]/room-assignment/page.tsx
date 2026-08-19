import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RoomAssignmentPage } from "./components/room-assignment-page";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }): Promise<Metadata> {
  const { roundId } = await params;
  return buildPageMetadata({
    title: "Gán phòng",
    path: `/manager/rounds/${roundId}/room-assignment`,
    noindex: true,
  });
}

export default async function ManagerRoomAssignmentPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  if (!roundId) notFound();

  return <RoomAssignmentPage roundId={roundId} />;
}
