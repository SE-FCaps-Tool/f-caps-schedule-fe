"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMasterDataLookups } from "@/lib/api/services/fetchMasterDataLookups";
import { managerKeys } from "@/lib/api/managerQueryKeys";

/** GET /majors — dùng cho select major trong form tạo đề tài */
export function useMajors() {
  return useQuery({
    queryKey: managerKeys.majors,
    queryFn: fetchMasterDataLookups.majors,
    staleTime: Infinity,
  });
}

/** GET /students — dùng cho select thành viên trong form tạo nhóm */
export function useStudents() {
  return useQuery({
    queryKey: managerKeys.students,
    queryFn: fetchMasterDataLookups.students,
    staleTime: Infinity,
  });
}
