import assert from "node:assert/strict";
import test from "node:test";

import { adaptGroupPreferences } from "./fetchLeaderPortal";
import { adaptLecturerAvailability } from "./fetchLecturerPortal";

test("adaptGroupPreferences flattens BE timeslots in Vietnam time", () => {
  assert.deepEqual(
    adaptGroupPreferences({
      roundId: 85,
      groupId: 7,
      timeslots: [
        {
          timeslotId: 76,
          startAt: "2030-02-01T02:00:00Z",
          endAt: "2030-02-01T02:30:00Z",
          selected: null,
          source: null,
        },
      ],
    }),
    [{ timeslotId: "76", date: "2030-02-01", startTime: "09:00", endTime: "09:30", selected: false }]
  );
});

test("adaptLecturerAvailability maps selected ids and keeps preferredLoad unknown", () => {
  assert.deepEqual(
    adaptLecturerAvailability({
      round: {},
      lecturerId: 12,
      selectedTimeslotIds: [76],
      timeslots: [
        {
          id: "76",
          startAt: "2030-02-01T17:30:00Z",
          endAt: "2030-02-01T18:00:00Z",
          dayDate: "2030-02-02",
        },
      ],
    }),
    {
      preferredLoad: null,
      slots: [{ timeslotId: "76", date: "2030-02-02", startTime: "00:30", endTime: "01:00", available: true }],
    }
  );
});
