import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PreferencesLanding } from "./components/preferences-landing";

export const metadata: Metadata = buildPageMetadata({
  title: "Đăng ký lịch",
  path: "/student/preferences",
  noindex: true,
});

export default function StudentPreferencesPage() {
  return <PreferencesLanding />;
}
