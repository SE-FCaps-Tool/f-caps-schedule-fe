import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ProjectsPage } from "./components/projects-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Đề tài",
  path: "/manager/projects",
  noindex: true,
});

export default function ManagerProjectsPage() {
  return <ProjectsPage />;
}
