import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { LoginLottie } from "./login/components/login-lottie";
import { FormBlob } from "./login/components/form-blob";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="hidden items-center justify-center p-6 lg:flex"
        style={{ backgroundColor: "oklch(0.88 0.075 47.604)" }}
      >
        <div className="h-full w-full">
          <LoginLottie />
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-8 overflow-hidden px-4 py-12">
        <FormBlob />
        <div className="flex items-center gap-2">
          <CalendarClock className="size-6 text-primary" />
          <span className="text-lg font-semibold">Capstone Scheduler</span>
        </div>
        {children}
      </div>
    </div>
  );
}
