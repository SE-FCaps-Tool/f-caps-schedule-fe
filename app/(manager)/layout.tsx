import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_MANAGER } from "@/lib/types/roles";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return <AppShell area={ROLE_MANAGER}>{children}</AppShell>;
}
