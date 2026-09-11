"use client";

import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SemesterContextProvider, useSemesterContext } from "@/components/semesters/semester-context";
import { SemesterSwitcher } from "@/components/semesters/semester-switcher";
import { useLecturerSemesters } from "@/hooks/lecturer/useLecturerPortal";
import { ROLE_LECTURER } from "@/lib/types/roles";

function LecturerShellInner({ children }: { children: ReactNode }) {
  const { currentSemesterId, semesters, isLoading, isError } = useSemesterContext();
  const noAccessibleSemester = !isLoading && !isError && semesters.length === 0;
  const navQuery = currentSemesterId ? `?semester=${encodeURIComponent(currentSemesterId)}` : undefined;

  return (
    <AppShell area={ROLE_LECTURER} headerExtra={<SemesterSwitcher />} navQuery={navQuery}>
      {isError ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-base font-semibold">Không tải được danh sách học kỳ</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Vui lòng tải lại trang để thử kết nối lại trước khi mở dữ liệu Lecturer.
          </p>
        </div>
      ) : noAccessibleSemester ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-base font-semibold">Chưa có học kỳ liên quan</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Các lời mời, lịch đánh giá và nhóm hướng dẫn của bạn sẽ xuất hiện khi được gắn với một học kỳ.
          </p>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <LecturerSemesterBoundary>{children}</LecturerSemesterBoundary>
    </Suspense>
  );
}

function LecturerSemesterBoundary({ children }: { children: ReactNode }) {
  const { data: semesters, isLoading, isError } = useLecturerSemesters();

  return (
    <SemesterContextProvider
      semesters={semesters}
      isLoading={isLoading}
      isError={isError}
      storageKey="lecturer:lastSemesterId"
      autoSelect
    >
      <LecturerShellInner>{children}</LecturerShellInner>
    </SemesterContextProvider>
  );
}
