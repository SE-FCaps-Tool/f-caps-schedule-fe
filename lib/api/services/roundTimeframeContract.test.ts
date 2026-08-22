import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoundCreatePayload,
  normalizeRoundTimeframeMetadata,
} from "./roundTimeframeContract.ts";

const base = {
  name: "Review tháng 9",
  type: "REVIEW_1" as const,
  startDate: "2030-09-01",
  endDate: "2030-09-03",
  durationMinutes: 45,
  reviewerCount: 2,
  maxGroupsPerTimeslot: 3,
  registrationDeadline: "2030-09-01T09:00:00+07:00",
  groupSelectionMode: true,
  resultOwnerMode: false,
  roomTypes: ["NORMAL" as const],
};

test("Timeframe mode sends timeframeId and omits manual days", () => {
  const payload = buildRoundCreatePayload(base, { mode: "timeframe", timeframeId: 12 });

  assert.equal(payload.timeframeId, 12);
  assert.equal(payload.days, undefined);
  assert.equal(payload.durationMinutes, 45);
});

test("Manual mode sends days and omits timeframeId", () => {
  const payload = buildRoundCreatePayload(base, {
    mode: "manual",
    days: [{ date: "2030-09-01", slots: [{ startTime: "07:00", endTime: "07:45" }] }],
  });

  assert.deepEqual(payload.days, [
    { date: "2030-09-01", slots: [{ startTime: "07:00", endTime: "07:45" }] },
  ]);
  assert.equal(payload.timeframeId, undefined);
});

test("Round timeframe metadata normalizes both camelCase and snake_case responses", () => {
  assert.deepEqual(normalizeRoundTimeframeMetadata({ timeframeId: 12, timeframeVersionId: 21 }), {
    timeframeId: "12",
    timeframeVersionId: "21",
  });
  assert.deepEqual(normalizeRoundTimeframeMetadata({ timeframe_id: 12, timeframe_version_id: 21 }), {
    timeframeId: "12",
    timeframeVersionId: "21",
  });
});

test("Legacy manual Round metadata remains nullable", () => {
  assert.deepEqual(normalizeRoundTimeframeMetadata({}), {
    timeframeId: null,
    timeframeVersionId: null,
  });
});
