import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_ADMIN } from "@/lib/types/roles";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell area={ROLE_ADMIN}>{children}</AppShell>;
}
