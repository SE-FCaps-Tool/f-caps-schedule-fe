"use client";

import { ReactNode } from "react";
import { ReduxProvider } from "./reduxProvider";
import { QueryProvider } from "./queryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthSyncAcrossTabs } from "@/hooks/useAuthSyncAcrossTabs";

function AuthSyncProvider({ children }: { children: ReactNode }) {
  useAuthSyncAcrossTabs();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <TooltipProvider>
          <AuthSyncProvider>{children}</AuthSyncProvider>
        </TooltipProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
