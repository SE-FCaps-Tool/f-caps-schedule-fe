"use client";

import { ReactNode } from "react";
import { QueryProvider } from "./queryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthSyncAcrossTabs } from "@/hooks/useAuthSyncAcrossTabs";

function AuthSyncProvider({ children }: { children: ReactNode }) {
  useAuthSyncAcrossTabs();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <AuthSyncProvider>{children}</AuthSyncProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
