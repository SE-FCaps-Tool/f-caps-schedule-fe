---
phase: 3
title: "Semester-scoped Lecturer portal data"
status: completed
priority: P1
effort: 7h
dependencies: [1, 2]
---

# Phase 3: Semester-Scoped Lecturer Portal Data

## Overview

Wire the selected semester into every Lecturer portal data consumer and make the round/semester relationship visible in the UI.

## Requirements

- Invitations: show semester, round, evaluation window/deadline, and status.
- Availability: list only accepted rounds inside the selected semester and show semester context on the detail header.
- My Schedule: filter sessions by semester and preserve existing week/list views; add round filter only where the current UI supports it safely.
- Supervised Groups: retain semester fields in the adapter and show a semester badge/section grouping.
- Remediation: filter and label cases by semester and source round.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturerPortal.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/lecturer/useLecturerPortal.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/components/layout/app-shell.tsx` (scope the pending-invitation badge query)
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/invitations/components/invitations-page.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/availability/components/availability-round-list-page.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/availability/[roundId]/components/availability-form-page.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/schedule/components/lecturer-schedule.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/supervised-groups/components/groups-table.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/supervised-groups/components/group-row.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/results/components/lecturer-results.tsx`

## Implementation Steps

1. Add `semesterId` to Lecturer query keys and service calls; disable queries until a valid selected semester exists.
2. Normalize semester metadata in invitation/session/project/remediation DTO adapters.
3. Add a compact semester label near each round where cards/rows could otherwise be ambiguous.
4. Keep page-level empty states distinct for “no data in this semester” versus “no semester selected.”
5. Ensure changing semester invalidates all Lecturer portal query keys and does not retain stale rows from the previous semester.

## Success Criteria

- [x] No Lecturer page displays rounds from a different selected semester.
- [x] Historical semesters can be viewed when the Lecturer has related data.
- [x] Existing accept/respond, availability submit, result submit, and remediation verify actions continue using round/session IDs correctly.
- [x] Loading and empty states remain usable after switching semesters.

## Risk Assessment

The dashboard currently contains mock data. Do not silently present mock counts as selected-semester facts; either scope the dashboard API data or mark those parts as outside this phase and avoid misleading labels.
