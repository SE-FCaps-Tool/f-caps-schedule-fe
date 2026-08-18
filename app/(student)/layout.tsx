import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/student/dashboard-header";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-muted/30">
      <DashboardHeader />
      <main className="w-full min-h-0 flex-1">{children}</main>
    </div>
  );
}
