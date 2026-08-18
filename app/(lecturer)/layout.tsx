import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_LECTURER } from "@/lib/types/roles";

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return <AppShell area={ROLE_LECTURER}>{children}</AppShell>;
}
