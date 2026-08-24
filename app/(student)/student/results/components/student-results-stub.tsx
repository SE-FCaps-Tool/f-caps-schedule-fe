import { Info } from "lucide-react";

/**
 * spec §37 liệt kê "Kết quả" trong sidebar Project Leader nhưng không có mục §38-40 nào mô tả
 * route/API/field riêng cho màn này (khác Manager Project Detail §18 có
 * GET /projects/:id/results, hoặc Lecturer §35 có GET/POST session result). Không suy đoán
 * field — kết quả gần nhất đã hiển thị tạm ở Tổng quan (field "Latest Result" trong §38).
 */
export function StudentResultsStub() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Kết quả</h1>
      <div className="mt-10 flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <Info className="size-5" />
        <p>Màn này chưa có API riêng trong spec BE.</p>
        <p>Xem kết quả gần nhất tạm thời ở trang Tổng quan.</p>
      </div>
    </div>
  );
}
