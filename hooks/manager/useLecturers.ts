"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLecturers } from "@/lib/api/services/fetchLecturers";
import { useInfiniteScroll } from "@/hooks/shared/useInfiniteScroll";

/** GET /lecturers — dùng cho các nơi cần cả danh sách 1 lần (mời, đổi reviewer...) */
export function useLecturers() {
  return useQuery({
    queryKey: ["manager", "lecturers"] as const,
    queryFn: () => fetchLecturers.list(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * GET /lecturers, load-more theo scroll — dùng cho AsyncCombobox trong các dialog gán GVHD.
 * Dựa trên hooks/shared/useInfiniteScroll.ts; BE /lecturers chưa hỗ trợ page/pageSize nên
 * hoạt động client-side (toàn bộ danh sách về trong "trang 1"), tự nâng cấp khi BE bổ sung.
 */
export function useLecturersInfinite(search?: string) {
  return useInfiniteScroll({
    queryKey: ["manager", "lecturers", "infinite", search ?? null] as const,
    queryFn: ({ page, pageSize }) => fetchLecturers.list({ page, pageSize, search }),
    pageSize: 20,
  });
}
