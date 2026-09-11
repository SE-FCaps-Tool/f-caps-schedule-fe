"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SemesterStatus } from "@/lib/api/services/fetchSemesters";

const SEMESTER_PARAM = "semester";

export interface SemesterContextItem {
  id: number;
  code: string;
  name: string;
  status: SemesterStatus;
  startDate: string;
  endDate: string;
}

interface SemesterContextValue {
  currentSemesterId: string | null;
  currentSemester: SemesterContextItem | null;
  semesters: SemesterContextItem[];
  isLoading: boolean;
  isError: boolean;
  setCurrentSemesterId: (code: string) => void;
}

interface SemesterContextProviderProps {
  children: ReactNode;
  semesters?: SemesterContextItem[];
  isLoading?: boolean;
  isError?: boolean;
  storageKey: string;
  autoSelect?: boolean;
}

const SemesterContext = createContext<SemesterContextValue | null>(null);

function defaultSemesterCode(semesters: SemesterContextItem[]) {
  return semesters.find((semester) => semester.status === "ACTIVE")?.code ?? semesters[0]?.code ?? null;
}

export function SemesterContextProvider({
  children,
  semesters = [],
  isLoading = false,
  isError = false,
  storageKey,
  autoSelect = false,
}: SemesterContextProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSemesterId = searchParams.get(SEMESTER_PARAM);
  const loaded = !isLoading && !isError;

  useEffect(() => {
    if (!loaded) return;

    const selectedIsAccessible = currentSemesterId ? semesters.some((semester) => semester.code === currentSemesterId) : false;
    const storedSemesterId = sessionStorage.getItem(storageKey);
    const storedIsAccessible = storedSemesterId ? semesters.some((semester) => semester.code === storedSemesterId) : false;

    if (currentSemesterId) {
      if (autoSelect && !selectedIsAccessible) {
        const fallback = storedIsAccessible ? storedSemesterId : defaultSemesterCode(semesters);
        if (fallback) {
          const params = new URLSearchParams(searchParams.toString());
          params.set(SEMESTER_PARAM, fallback);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
        return;
      }
      sessionStorage.setItem(storageKey, currentSemesterId);
      return;
    }

    const fallback = storedIsAccessible ? storedSemesterId : autoSelect ? defaultSemesterCode(semesters) : storedSemesterId;
    if (!fallback) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(SEMESTER_PARAM, fallback);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [autoSelect, currentSemesterId, isError, isLoading, loaded, pathname, router, searchParams, semesters, storageKey]);

  const currentSemester = semesters.find((semester) => semester.code === currentSemesterId) ?? null;

  function setCurrentSemesterId(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(SEMESTER_PARAM, code);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <SemesterContext.Provider
      value={{
        currentSemesterId,
        currentSemester,
        semesters,
        isLoading,
        isError,
        setCurrentSemesterId,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemesterContext() {
  const context = useContext(SemesterContext);
  if (!context) throw new Error("useSemesterContext phải dùng bên trong SemesterContextProvider");
  return context;
}

export function useOptionalSemesterContext() {
  return useContext(SemesterContext);
}
