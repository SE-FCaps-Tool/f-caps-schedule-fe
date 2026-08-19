import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AccountsPage } from "./components/accounts-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Tài khoản & phân quyền",
  path: "/admin/accounts",
  noindex: true,
});

export default function AdminAccountsPage() {
  return <AccountsPage />;
}
