"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoPageSizeOptions {
  /** Chiều cao 1 hàng (px) — mặc định khớp TableRow h-10 + border-b 1px. */
  rowHeight?: number;
  minPageSize?: number;
  maxPageSize?: number;
  /** Khoảng chừa dưới container (pagination bar, padding trang...). */
  reservedBottom?: number;
}

/**
 * Đo khoảng trống còn lại từ vị trí `containerRef` tới đáy viewport, suy ra số hàng vừa
 * đủ hiển thị không cần cuộn trang — dùng làm pageSize mặc định cho bảng. Đo lại khi
 * resize; gắn `containerRef` vào div bọc ngay phía trên bảng.
 */
export function useAutoPageSize({
  rowHeight = 41,
  minPageSize = 5,
  maxPageSize = 50,
  reservedBottom = 16,
}: UseAutoPageSizeOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageSize, setPageSize] = useState(minPageSize);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const available = window.innerHeight - top - reservedBottom;
    const rows = Math.floor(available / rowHeight);
    setPageSize(Math.min(maxPageSize, Math.max(minPageSize, rows)));
  }, [rowHeight, minPageSize, maxPageSize, reservedBottom]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return { containerRef, pageSize };
}
