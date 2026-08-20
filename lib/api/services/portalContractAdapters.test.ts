import assert from "node:assert/strict";
import test from "node:test";

import { adaptGroupPreferences, adaptLeaderSession } from "./fetchLeaderPortal";
import { adaptLecturerAvailability, adaptLecturerSession, adaptSupervisedProject } from "./fetchLecturerPortal";

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
      lecturer_id: 12,
      selected_timeslot_ids: [76],
      timeslots: [
        {
          id: "76",
          start_at: "2030-02-01T17:30:00Z",
          end_at: "2030-02-01T18:00:00Z",
          day_date: "2030-02-02",
        },
      ],
    }),
    {
      preferredLoad: null,
      slots: [{ timeslotId: "76", date: "2030-02-02", startTime: "00:30", endTime: "01:00", available: true }],
    }
  );
});

test("adaptLecturerSession nests round/group from BE's flat row", () => {
  assert.deepEqual(
    adaptLecturerSession({
      id: 10,
      round_id: 1,
      round_type: "REVIEW_1",
      group_id: 28,
      group_code: "G01",
      project_code: "PRJ001",
      start_at: "2026-08-25T01:00:00Z",
      end_at: "2026-08-25T02:00:00Z",
      room_code: "A101",
      status: "SCHEDULED",
    }),
    {
      id: "10",
      round: { id: "1", name: "REVIEW_1", type: "REVIEW_1" },
      group: { id: "28", code: "G01", projectTitle: "PRJ001" },
      date: "2026-08-25",
      startTime: "08:00",
      endTime: "09:00",
      roomCode: "A101",
      myRole: "REVIEWER",
      council: [],
      status: "SCHEDULED",
    }
  );
});

test("adaptLecturerSession keeps group null when BE omits group_id", () => {
  const result = adaptLecturerSession({
    id: 11,
    round_id: 2,
    round_type: "DEFENSE_1_1",
    start_at: "2026-08-25T01:00:00Z",
    end_at: "2026-08-25T02:00:00Z",
    status: "SCHEDULED",
  });
  assert.equal(result.group, null);
});

test("adaptLeaderSession nests round from BE's flat row", () => {
  assert.deepEqual(
    adaptLeaderSession({
      id: 10,
      round_id: 1,
      round_type: "REVIEW_1",
      group_id: 28,
      group_code: "G01",
      project_code: "PRJ001",
      start_at: "2026-08-25T01:00:00Z",
      end_at: "2026-08-25T02:00:00Z",
      room_code: "A101",
      status: "SCHEDULED",
    }),
    {
      id: "10",
      round: { id: "1", name: "REVIEW_1", type: "REVIEW_1" },
      date: "2026-08-25",
      startTime: "08:00",
      endTime: "09:00",
      roomCode: "A101",
      council: [],
      status: "SCHEDULED",
    }
  );
});

test("adaptSupervisedProject maps known fields and nulls out fields BE hasn't shipped yet", () => {
  assert.deepEqual(
    adaptSupervisedProject({
      id: 23,
      code: "PRJ001",
      title: "Demo project",
      status: "ACTIVE",
      semester_id: 1,
      semester_code: "SE-2026-2027",
      supervisor_type: "MAIN",
    }),
    {
      id: "23",
      code: "PRJ001",
      titleVi: "Demo project",
      supervisorRole: "MAIN",
      group: null,
      projectStatus: "ACTIVE",
      nextEvaluation: null,
      latestResult: null,
      remediation: null,
    }
  );
});
