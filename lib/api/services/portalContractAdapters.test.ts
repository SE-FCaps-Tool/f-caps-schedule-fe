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

test("adaptLecturerSession maps BE's flat camelCase row (docs/api/lecturer-sessions-fe-guide.md)", () => {
  assert.deepEqual(
    adaptLecturerSession({
      id: 10,
      roundId: 1,
      roundType: "REVIEW_1",
      groupId: 28,
      groupCode: "G01",
      projectCode: "PRJ001",
      startAt: "2026-08-25T01:00:00Z",
      endAt: "2026-08-25T02:00:00Z",
      roomCode: "A101",
      status: "SCHEDULED",
    }),
    {
      id: "10",
      roundId: "1",
      roundType: "REVIEW_1",
      groupId: "28",
      groupCode: "G01",
      projectCode: "PRJ001",
      date: "2026-08-25",
      startTime: "08:00",
      endTime: "09:00",
      roomCode: "A101",
      status: "SCHEDULED",
    }
  );
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

test("adaptSupervisedProject maps group with leader and members, nulls out fields BE hasn't shipped yet", () => {
  assert.deepEqual(
    adaptSupervisedProject({
      id: 23,
      code: "PRJ001",
      title: "Demo project",
      status: "ACTIVE",
      semester_id: 1,
      semester_code: "SE-2026-2027",
      supervisor_type: "MAIN",
      group: {
        id: 7,
        code: "G01",
        memberCount: 2,
        leader: { id: 101, name: "Nguyen Van A", code: "SE180001" },
        members: [
          { id: 101, name: "Nguyen Van A", code: "SE180001", role: "LEADER", status: "ACTIVE" },
          { id: 102, name: "Tran Thi B", code: "SE180002", role: "MEMBER", status: "DROPPED" },
        ],
      },
    }),
    {
      id: "23",
      code: "PRJ001",
      titleVi: "Demo project",
      supervisorRole: "MAIN",
      group: {
        id: "7",
        code: "G01",
        memberCount: 2,
        leader: { id: "101", name: "Nguyen Van A", code: "SE180001" },
        members: [
          { id: "101", name: "Nguyen Van A", code: "SE180001", role: "LEADER", status: "ACTIVE" },
          { id: "102", name: "Tran Thi B", code: "SE180002", role: "MEMBER", status: "DROPPED" },
        ],
      },
      projectStatus: "ACTIVE",
      nextEvaluation: null,
      latestResult: null,
      remediation: null,
    }
  );
});

test("adaptSupervisedProject keeps group null when BE hasn't formed a group yet", () => {
  assert.deepEqual(
    adaptSupervisedProject({
      id: 24,
      code: "PRJ002",
      title: "Demo project 2",
      status: "ACTIVE",
      supervisor_type: "CO",
      group: null,
    }),
    {
      id: "24",
      code: "PRJ002",
      titleVi: "Demo project 2",
      supervisorRole: "CO",
      group: null,
      projectStatus: "ACTIVE",
      nextEvaluation: null,
      latestResult: null,
      remediation: null,
    }
  );
});
