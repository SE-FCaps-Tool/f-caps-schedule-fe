import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ConfigHub } from "./components/config-hub";

export const metadata: Metadata = buildPageMetadata({
  title: "Cấu hình",
  path: "/admin/master-data",
  noindex: true,
});

export default function AdminConfigPage() {
  return <ConfigHub />;
}
