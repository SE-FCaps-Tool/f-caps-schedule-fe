import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ProjectDetailPage } from "./components/project-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  return buildPageMetadata({
    title: "Đề tài",
    path: `/manager/projects/${projectId}`,
    noindex: true,
  });
}

export default async function ManagerProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!projectId) notFound();

  return <ProjectDetailPage projectId={projectId} />;
}
