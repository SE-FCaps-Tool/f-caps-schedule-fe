"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAudit, type AuditListParams } from "@/lib/api/services/fetchAudit";
import { adminKeys } from "@/lib/api/adminQueryKeys";

export function useAudit(params?: AuditListParams) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: () => fetchAudit.list(params),
    staleTime: 15 * 1000,
  });
}
