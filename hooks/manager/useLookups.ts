"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMasterDataLookups } from "@/lib/api/services/fetchMasterDataLookups";
import { managerKeys } from "@/lib/api/managerQueryKeys";

/** GET /majors — dùng cho select major trong form tạo đề tài */
export function useMajors() {
  return useQuery({
    queryKey: managerKeys.majors,
    queryFn: fetchMasterDataLookups.majors,
    staleTime: 5 * 60 * 1000,
  });
}

/** GET /students — dùng cho select thành viên trong form tạo nhóm */
export function useStudents() {
  return useQuery({
    queryKey: managerKeys.students,
    queryFn: fetchMasterDataLookups.students,
    staleTime: 5 * 60 * 1000,
  });
}
