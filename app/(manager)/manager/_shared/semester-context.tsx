"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSemesters } from "@/hooks/useSemesters";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";

const SEMESTER_PARAM = "semester";

interface SemesterContextValue {
  currentSemesterId: string | null;
  currentSemester: SemesterApiItem | null;
  semesters: SemesterApiItem[];
  isLoading: boolean;
  isError: boolean;
  setCurrentSemesterId: (code: string) => void;
}

const SemesterContext = createContext<SemesterContextValue | null>(null);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: semesters, isLoading, isError } = useSemesters();

  const currentSemesterId = searchParams.get(SEMESTER_PARAM);

  // Nhớ học kỳ đã chọn để tự khôi phục vào URL khi điều hướng tới một trang
  // không tự nối lại query string (link nội dung, không phải sidebar).
  const lastSemesterRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentSemesterId) {
      lastSemesterRef.current = currentSemesterId;
      return;
    }
    if (!lastSemesterRef.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(SEMESTER_PARAM, lastSemesterRef.current);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, currentSemesterId, searchParams, router]);

  const currentSemester = (semesters ?? []).find((s) => s.code === currentSemesterId) ?? null;

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
        semesters: semesters ?? [],
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
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useSemesterContext phải dùng bên trong SemesterProvider");
  return ctx;
}
