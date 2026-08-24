"use client";

import { ReactNode, Suspense } from "react";
import { QueryProvider } from "./queryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { useAuthSyncAcrossTabs } from "@/hooks/useAuthSyncAcrossTabs";

function AuthSyncProvider({ children }: { children: ReactNode }) {
  useAuthSyncAcrossTabs();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <AuthSyncProvider>
          {children}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
        </AuthSyncProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
