"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_MANAGER } from "@/lib/types/roles";
import { SemesterProvider, useSemesterContext } from "./semester-context";
import { SemesterSwitcher } from "./semester-switcher";

/** Các mục sidebar phụ thuộc Semester Context — khoá khi chưa chọn học kỳ (§1.1) */
const SEMESTER_SCOPED_HREFS = [
  "/manager/projects",
  "/manager/groups",
  "/manager/rounds",
  "/manager/calendar",
  "/manager/progress",
  "/manager/results",
  "/manager/reports",
];

function ManagerShellInner({ children }: { children: ReactNode }) {
  const { currentSemesterId } = useSemesterContext();
  const disabledHrefs = currentSemesterId ? [] : SEMESTER_SCOPED_HREFS;
  const navQuery = currentSemesterId ? `?semester=${encodeURIComponent(currentSemesterId)}` : undefined;

  return (
    <AppShell
      area={ROLE_MANAGER}
      headerExtra={<SemesterSwitcher />}
      disabledHrefs={disabledHrefs}
      onDisabledClick={() => toast.info("Vui lòng chọn học kỳ để tiếp tục.")}
      navQuery={navQuery}
    >
      {children}
    </AppShell>
  );
}

export function ManagerShell({ children }: { children: ReactNode }) {
  return (
    <SemesterProvider>
      <ManagerShellInner>{children}</ManagerShellInner>
    </SemesterProvider>
  );
}
