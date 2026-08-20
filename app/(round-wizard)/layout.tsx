import { Suspense } from "react";
import type { ReactNode } from "react";
import { SemesterProvider } from "@/app/(manager)/manager/_shared/semester-context";

/**
 * Layout riêng cho các trang "phiếu" toàn màn hình (vd. tạo đợt đánh giá) — cố tình KHÔNG
 * bọc AppShell/ManagerShell (không sidebar, không breadcrumb header) để giữ focus vào form.
 * Vẫn cần SemesterProvider vì các trang này gọi useSemesterContext() như mọi trang manager khác.
 */
export default function RoundWizardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <SemesterProvider>{children}</SemesterProvider>
    </Suspense>
  );
}
