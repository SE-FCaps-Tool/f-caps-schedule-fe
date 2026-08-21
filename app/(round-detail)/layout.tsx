import { Suspense } from "react";
import type { ReactNode } from "react";
import { SemesterProvider } from "@/app/(manager)/manager/_shared/semester-context";

/**
 * Layout riêng cho trang chi tiết Round (toàn màn hình) — cố tình KHÔNG bọc AppShell/ManagerShell
 * (không sidebar, không breadcrumb header) để Calendar có tối đa không gian. Giống hệt
 * `(round-wizard)/layout.tsx`. Vẫn cần SemesterProvider vì các trang này gọi useSemesterContext()
 * như mọi trang manager khác.
 */
export default function RoundDetailLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <SemesterProvider>{children}</SemesterProvider>
    </Suspense>
  );
}
