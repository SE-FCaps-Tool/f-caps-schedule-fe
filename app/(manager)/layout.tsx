import { Suspense } from "react";
import type { ReactNode } from "react";
import { ManagerShell } from "./manager/_shared/manager-shell";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <ManagerShell>{children}</ManagerShell>
    </Suspense>
  );
}
