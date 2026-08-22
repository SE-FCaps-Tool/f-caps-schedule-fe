export const adminKeys = {
  accounts: ["admin", "accounts"] as const,
  lecturers: ["admin", "lecturers"] as const,
  rooms: ["admin", "rooms"] as const,
  committees: (lecturerId?: string) => ["admin", "committees", lecturerId ?? null] as const,
  semesters: (params?: { search?: string; status?: string; academicYear?: string }) =>
    ["admin", "semesters", params ?? {}] as const,
  semester: (id: number) => ["admin", "semester", id] as const,
  audit: (params?: { actorId?: number; action?: string; entityType?: string; limit?: number }) =>
    ["admin", "audit", params ?? {}] as const,
};
