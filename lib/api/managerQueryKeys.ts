export const managerKeys = {
  majors: ["manager", "majors"] as const,
  students: ["manager", "students"] as const,
  projects: (semesterId?: number | null) => ["manager", "projects", semesterId ?? null] as const,
  groups: (semesterId?: number | null) => ["manager", "groups", semesterId ?? null] as const,
  groupOverview: (groupId: string | number) => ["manager", "group", groupId, "overview"] as const,
  rounds: (semesterId?: number | null) => ["manager", "rounds", semesterId ?? null] as const,
  // Lưu ý: key KHÔNG nhúng semesterId — resource đã định danh duy nhất bởi id riêng
  // (round_id/version_id/session_id); nhúng thêm semesterId vào key sẽ làm invalidateQueries
  // theo prefix ["manager","round",roundId] không khớp được các query đã cache với semesterId khác.
  round: (roundId: number) => ["manager", "round", roundId] as const,
  roundRegistration: (roundId: number) => ["manager", "round", roundId, "registration"] as const,
  roundMyAvailability: (roundId: number) => ["manager", "round", roundId, "my-availability"] as const,
  scheduleVersions: (roundId: number) => ["manager", "round", roundId, "versions"] as const,
  scheduleVersion: (versionId: number) => ["manager", "version", versionId] as const,
  replacementSuggestions: (sessionId: number) => ["manager", "session", sessionId, "replacement-suggestions"] as const,
  sessionResult: (sessionId: number) => ["manager", "session", sessionId, "result"] as const,
  remediation: ["manager", "remediation"] as const,
  dashboard: (semesterId?: number | null, roundId?: number | null) =>
    ["manager", "dashboard", semesterId ?? null, roundId ?? null] as const,
  reportsLecturerLoad: (semesterId?: number | null, roundId?: number | null) =>
    ["manager", "reports", "lecturer-load", semesterId ?? null, roundId ?? null] as const,
  reportsUnscheduled: (roundId: number, semesterId?: number | null) =>
    ["manager", "reports", "unscheduled", roundId, semesterId ?? null] as const,
  reportsQuality: (semesterId?: number | null) => ["manager", "reports", "quality", semesterId ?? null] as const,
  reportsRemediation: (semesterId?: number | null, roundId?: number | null) =>
    ["manager", "reports", "remediation", semesterId ?? null, roundId ?? null] as const,
  reportsOutcomes: (semesterId?: number | null, roundId?: number | null) =>
    ["manager", "reports", "outcomes", semesterId ?? null, roundId ?? null] as const,
  provenance: (versionId: number, semesterId?: number | null) =>
    ["manager", "provenance", versionId, semesterId ?? null] as const,
  notifications: (limit?: number) => ["manager", "notifications", limit ?? null] as const,
};
