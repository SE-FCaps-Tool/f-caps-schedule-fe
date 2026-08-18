import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <CalendarClock className="size-6 text-primary" />
        <span className="text-lg font-semibold">Capstone Scheduler</span>
      </div>
      {children}
    </div>
  );
}
