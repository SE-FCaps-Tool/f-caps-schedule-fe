"use client";

import type { ReactNode } from "react";
import { useSemesters } from "@/hooks/useSemesters";
import { SemesterContextProvider, useSemesterContext, useOptionalSemesterContext, type SemesterContextItem } from "@/components/semesters/semester-context";

export function SemesterProvider({ children }: { children: ReactNode }) {
  const { data: semesters, isLoading, isError } = useSemesters();
  return (
    <SemesterContextProvider
      semesters={(semesters ?? []) as SemesterContextItem[]}
      isLoading={isLoading}
      isError={isError}
      storageKey="manager:lastSemesterId"
    >
      {children}
    </SemesterContextProvider>
  );
}

export { useSemesterContext, useOptionalSemesterContext };
