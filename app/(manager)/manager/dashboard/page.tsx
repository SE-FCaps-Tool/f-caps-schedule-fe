import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ManagerDashboard } from "./components/manager-dashboard";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan Bộ môn",
  path: "/manager/dashboard",
  noindex: true,
});

export default function ManagerDashboardPage() {
  return <ManagerDashboard />;
}
