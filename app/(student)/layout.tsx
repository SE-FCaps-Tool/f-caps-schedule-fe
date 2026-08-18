import type { ReactNode } from "react";
import { StudentHeader } from "@/components/layout/student-header";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-muted/30">
      <StudentHeader />
      <main className="w-full min-h-0 flex-1">{children}</main>
    </div>
  );
}
