"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLecturers, type LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import { useInfiniteScroll } from "@/hooks/shared/useInfiniteScroll";

const LECTURER_LOOKUP_PAGE_SIZE = 200;

async function fetchAllLecturers() {
  const lecturers: LecturerApiItem[] = [];
  let page = 1;

  while (true) {
    const response = await fetchLecturers.list({ page, pageSize: LECTURER_LOOKUP_PAGE_SIZE });
    lecturers.push(...response.data);

    if (!response.meta || response.data.length === 0 || lecturers.length >= response.meta.total) {
      return lecturers;
    }
    page += 1;
  }
}

/** GET /lecturers — dùng cho các nơi cần cả danh sách 1 lần (mời, đổi reviewer...) */
export function useLecturers() {
  return useQuery({
    queryKey: ["manager", "lecturers"] as const,
    queryFn: fetchAllLecturers,
    staleTime: Infinity,
  });
}

/**
 * GET /lecturers, load-more theo scroll — dùng cho AsyncCombobox trong các dialog gán GVHD.
 * Dựa trên hooks/shared/useInfiniteScroll.ts — BE giờ đã trả `meta` thật (xem
 * docs/be-checklist-open-questions.md mục 6) nên load-more chạy phân trang server thật.
 */
export function useLecturersInfinite(search?: string) {
  return useInfiniteScroll({
    queryKey: ["manager", "lecturers", "infinite", search ?? null] as const,
    queryFn: ({ page, pageSize }) => fetchLecturers.list({ page, pageSize, search }),
    pageSize: 20,
  });
}
