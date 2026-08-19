export const adminKeys = {
  accounts: ["admin", "accounts"] as const,
  lecturers: ["admin", "lecturers"] as const,
  rooms: ["admin", "rooms"] as const,
  semesters: ["admin", "semesters"] as const,
  audit: (params?: { actorId?: number; action?: string; entityType?: string; limit?: number }) =>
    ["admin", "audit", params ?? {}] as const,
};
