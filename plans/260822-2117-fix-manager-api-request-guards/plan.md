---
title: "Fix manager lookup pagination and room request guards"
description: "Prevent 422 lookup requests and 409 room-availability requests while preserving existing manager UI behavior."
status: pending
priority: P1
effort: 2h
branch: dev
tags: [bugfix, frontend, api]
blockedBy: []
blocks: []
created: 2026-08-22
---

# Fix Manager API Request Guards

## Overview

Apply a surgical frontend fix for two API-contract mismatches:

- Fetch complete lecturer/group lookup data in pages no larger than the backend maximum of 200.
- Call `GET /rounds/{roundId}/rooms/available` only when the round has an `ACTIVE` schedule version and, for the assignment dialog, an actual session target.

Seven pre-existing modified files belong to another workstream. Preserve all existing hunks; this plan overlaps only `hooks/manager/useLecturers.ts` and `round-groups-panel.tsx`, so those edits require line-level patching and explicit diff review.

## Cross-Plan Dependencies

None. No existing `plans/` directory or unfinished plan was present when this plan was created.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Implement and verify request guards](./phase-01-implement-and-verify.md) | Pending |

## Dependencies

- Existing React Query hooks and API services.
- Backend pagination contract: `pageSize <= 200`, response `meta.total`.
- Backend room-assignment contract: available-room lookup requires the round's current schedule version to be `ACTIVE`.

## Acceptance Criteria

- Lecturer and semester-group requests never send `pageSize=500`.
- Lookup hooks continue fetching until `meta.total` is satisfied, so reducing page size does not silently truncate lists above 200 rows.
- Calendar and round-detail calendar do not call `/rooms/available` before an `ACTIVE` version exists; published schedules use room catalog data for display.
- Room-assignment page and dialog do not call `/rooms/available` without an active version/session target.
- Suggest/apply room controls are disabled when no `ACTIVE` schedule version exists.
- Existing seven dirty files retain all unrelated user changes.
- Lint, TypeScript checking, production build, and browser network verification pass.

