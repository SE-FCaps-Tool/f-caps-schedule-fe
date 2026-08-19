"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLecturers } from "@/lib/api/services/fetchLecturers";

/** GET /lecturers — dùng cho picker giảng viên (mời, đổi reviewer, gán GVHD...) */
export function useLecturers() {
  return useQuery({
    queryKey: ["manager", "lecturers"] as const,
    queryFn: fetchLecturers.list,
    staleTime: 5 * 60 * 1000,
  });
}
