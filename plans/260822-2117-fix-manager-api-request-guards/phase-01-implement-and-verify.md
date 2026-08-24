# Phase 1: Implement and Verify Request Guards

## Overview

- Priority: P1
- Status: Pending
- Effort: 2h
- Scope: Frontend-only bugfix; no backend, schema, route, or dependency changes.

## Key Findings

- `hooks/manager/useLecturers.ts` and `round-groups-panel.tsx` currently request one page of 500 records. Backend caps `pageSize` at 200, causing 422 responses.
- `useAvailableRooms` enables whenever `roundId` is non-null. Four callers pass a round ID before the preconditions for `/rooms/available` are met, causing `ROOM_ASSIGNMENT_STATE_INVALID` (409).
- `CalendarPage` and `RoundCalendarPanel` prefer `PUBLISHED` over `ACTIVE`. A published schedule still needs room metadata for rendering, but the active-only `/rooms/available` endpoint is not the correct source.
- The repository has no component-test harness or `test` package script. Validation must combine static checks, production build, and focused browser/network scenarios.

## Related Code Files

Modify only:

| File | Change |
|---|---|
| `W:/f-caps-schedule-fe/hooks/manager/useLecturers.ts` | Replace the 500-row lookup with sequential pages of at most 200, concatenated until `meta.total` is reached. Preserve current query key/staleness and existing dirty edits. |
| `W:/f-caps-schedule-fe/hooks/manager/useGroups.ts` | Add a dedicated complete-lookup query (or equivalent private fetch loop) that requests group pages of at most 200 and returns the flattened data. Keep the existing paginated `useGroups` contract unchanged for normal pages. |
| `W:/f-caps-schedule-fe/app/(round-detail)/manager/rounds/[roundId]/components/round-groups-panel.tsx` | Use the complete group lookup instead of issuing `pageSize=500`. Preserve all other dirty panel work. |
| `W:/f-caps-schedule-fe/hooks/manager/useRoomAssignment.ts` | Add a manager room-catalog query/adaptor for published-schedule display, using `/rooms` in pages of at most 200 and returning `AssignableRoom[]`. Do not weaken `useAvailableRooms`; callers must pass `null` when ineligible. |
| `W:/f-caps-schedule-fe/app/(manager)/manager/calendar/components/calendar-page.tsx` | Resolve `currentVersion` before room hooks. Use `/rooms/available` only for `ACTIVE`; use catalog rooms for `PUBLISHED`; call neither without a current version. Keep session fetching tied to the chosen version. |
| `W:/f-caps-schedule-fe/app/(round-detail)/manager/rounds/[roundId]/components/round-calendar-panel.tsx` | Apply the same ACTIVE/PUBLISHED room-source selection as CalendarPage. Draft preview remains roomless and must not trigger either active-room operation. |
| `W:/f-caps-schedule-fe/app/(round-detail)/manager/rounds/[roundId]/room-assignment/components/room-assignment-page.tsx` | Gate page-level available-room lookup on `activeVersion`; gate dialog lookup on non-null `session`; disable suggest/apply actions without `activeVersion`. |

No files are created or deleted outside this plan artifact.

## Implementation Steps

1. Preserve the dirty worktree.
   - Record `git status --short` and `git diff --` for all seven existing modified files before editing.
   - Use small patches. Do not reformat or replace whole files.
   - After implementation, compare the overlapping files against the baseline diff and confirm unrelated hunks remain byte-for-byte intact.

2. Fix paginated lookup loading without data loss.
   - Define a local maximum page size of 200 for lecturer and complete-group lookups.
   - Fetch page 1, append its `data`, then fetch subsequent pages while accumulated rows are fewer than `meta.total`.
   - If legacy responses omit `meta`, stop after the first response; do not loop indefinitely.
   - Also stop when a page is empty. This protects against inconsistent `meta.total`.
   - Preserve existing React Query cache keys unless the returned data shape changes. The flattened lecturer hook remains `LecturerApiItem[]`; the complete group hook should expose `GroupListItem[]` so the panel no longer depends on list metadata.

3. Add a published-schedule room catalog source.
   - In `useRoomAssignment.ts`, read `/rooms` via `fetchRooms.list({page, pageSize: 200})`, concatenate pages, and adapt numeric IDs plus optional `type`/`status` fields into `AssignableRoom`.
   - Use a distinct manager query key so catalog data cannot collide with the active-round availability cache.
   - Catalog data is display/reference data. `/rooms/available` remains the source for active assignment choices and conflict-aware room operations.

4. Guard calendar room requests by schedule state.
   - In `CalendarPage`, compute the chosen version first.
   - Pass `selectedRoundId` to `useAvailableRooms` only when `currentVersion?.status === "ACTIVE"`; otherwise pass `null`.
   - Enable the catalog query only when the chosen version is `PUBLISHED`.
   - Select one normalized `roomColumns` array: active availability for ACTIVE, catalog for PUBLISHED, empty otherwise. Filter catalog display to round-compatible rooms while retaining rooms referenced by loaded sessions so historical/inactive assignments do not disappear from the grid.
   - Repeat the same selection in `RoundCalendarPanel`; draft preview continues using `DraftScheduleGrid` and does not fetch active rooms.
   - Keep hook invocation unconditional and express conditions through each hook's `enabled` input to satisfy React hook rules.

5. Guard the assignment page and dialog.
   - Page-level call: `useAvailableRooms(activeVersion ? roundId : null)`.
   - Dialog call: `useAvailableRooms(session ? roundId : null, session ? {timeslotId: session.timeslotId} : undefined)`.
   - Disable “Gợi ý gán phòng” when there is no active version or its mutation is pending.
   - Disable “Áp dụng gợi ý” when there is no active version, no suggestion set, or its mutation is pending.
   - Clear stale suggestions if the active version disappears during a query refresh, or ensure they cannot be applied while inactive.

6. Review the request matrix in browser DevTools.
   - No ACTIVE/PUBLISHED version: sessions and `/rooms/available` are not requested; empty-state guidance remains visible.
   - ACTIVE version: `/rooms/available` is requested once per relevant query key; session-specific dialog request starts only after selecting an unassigned session.
   - PUBLISHED version: `/rooms` catalog is requested; `/rooms/available` is not; schedule still renders room codes/columns.
   - Lecturer and group lookups use `pageSize=200` maximum and request page 2+ only when `meta.total > accumulated length`.

7. Run validation from `W:/f-caps-schedule-fe`.
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
   - There is no configured automated component-test command. Treat the browser scenarios above as the regression test for network gating and UI state.
   - Run `git diff --check` and inspect `git diff --stat` plus the full diff of the seven production files.

## Success Criteria

- Network panel contains no 422 for lecturer/group lookup and no 409 from premature `/rooms/available` calls.
- Lists remain complete beyond 200 rows through bounded sequential pagination.
- Published schedules retain readable room metadata without using the active-only endpoint.
- Assignment actions cannot be invoked without an active schedule version.
- Static checks/build succeed and no unrelated dirty change is reverted or reformatted.

## Risks and Mitigations

- **Dirty-file overlap:** two required files already contain user edits. Mitigate with baseline diff capture and narrow patches.
- **Infinite pagination:** inconsistent/missing metadata could loop. Stop on absent metadata, empty page, or accumulated count reaching total.
- **Query-cache collision:** room catalog and round availability return the same normalized type but different semantics. Use separate keys.
- **Published historical room removed/inactive:** retain any room referenced by sessions when deriving display columns; do not hide an existing assignment solely because current catalog status changed.
- **Catalog rooms are not availability guarantees:** do not use the catalog to bypass backend validation for ACTIVE assignment operations.

## Security and Compatibility

- No auth or permission changes. Existing backend authorization remains authoritative.
- No API contract, persistence, or migration changes.
- Requests remain bounded at the backend-supported maximum; extra pages are fetched only when response metadata requires them.

