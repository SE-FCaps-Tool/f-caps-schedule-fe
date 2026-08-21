"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSemesters } from "@/hooks/useSemesters";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";

const SEMESTER_PARAM = "semester";
const SEMESTER_STORAGE_KEY = "manager:lastSemesterId";

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

  /**
   * Nhớ học kỳ đã chọn để tự khôi phục vào URL khi điều hướng tới một trang không tự nối lại
   * query string (link nội dung, không phải sidebar). Dùng sessionStorage thay vì ref cục bộ —
   * Round Detail/Room Assignment/wizard tạo round sống ở route group riêng (không AppShell), nên
   * SemesterProvider bị unmount/mount lại mỗi lần qua lại các group đó, xoá sạch state cục bộ.
   */
  useEffect(() => {
    if (currentSemesterId) {
      sessionStorage.setItem(SEMESTER_STORAGE_KEY, currentSemesterId);
      return;
    }
    const lastSemesterId = sessionStorage.getItem(SEMESTER_STORAGE_KEY);
    if (!lastSemesterId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(SEMESTER_PARAM, lastSemesterId);
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
