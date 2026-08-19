import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AdminDashboard } from "./components/admin-dashboard";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan quản trị",
  path: "/admin/dashboard",
  noindex: true,
});

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
