import type { RoundCreatePayload } from "./fetchRounds";

export type RoundScheduleSource =
  | { mode: "timeframe"; timeframeId: number }
  | { mode: "manual"; days: NonNullable<RoundCreatePayload["days"]> };

export function buildRoundCreatePayload(
  base: Omit<RoundCreatePayload, "days" | "timeframeId">,
  source: RoundScheduleSource,
): RoundCreatePayload {
  return source.mode === "timeframe"
    ? { ...base, timeframeId: source.timeframeId }
    : { ...base, days: source.days };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pick(record: Record<string, unknown>, ...keys: string[]) {
  return keys.map((key) => record[key]).find((value) => value !== undefined);
}

function normalizeNullableId(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

export function normalizeRoundTimeframeMetadata(value: unknown): {
  timeframeId: string | null;
  timeframeVersionId: string | null;
} {
  const record = isRecord(value) ? value : {};
  return {
    timeframeId: normalizeNullableId(pick(record, "timeframeId", "timeframe_id")),
    timeframeVersionId: normalizeNullableId(
      pick(record, "timeframeVersionId", "timeframe_version_id"),
    ),
  };
}
