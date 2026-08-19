import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AuditLogPage } from "./components/audit-log-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Audit log",
  path: "/admin/audit-log",
  noindex: true,
});

export default function AdminAuditLogPage() {
  return <AuditLogPage />;
}
