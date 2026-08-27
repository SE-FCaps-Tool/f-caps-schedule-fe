---
title: "Add Lecturer Semester Context and Header Switcher"
description: "Expose semester context for Lecturer, scope lecturer portal data by semester, and reuse the Manager header pattern."
status: in-progress
priority: P1
effort: 2d
branch: dev
tags: [feature, lecturer, semester, api, frontend]
blockedBy: []
blocks: []
created: 2026-08-26
---

# Add Lecturer Semester Context and Header Switcher

## Overview

Add a semester context to the Lecturer portal so every round is presented inside its owning semester. The Lecturer header will reuse the Manager visual pattern: a right-aligned semester switcher, URL persistence, and query invalidation when the selected semester changes.

The implementation must be full-stack. A visual selector without backend filtering is explicitly rejected because it would make the selected semester cosmetic and could mix rounds from different semesters.

## Scout Findings

- Backend is FastAPI + SQLAlchemy text queries; Lecturer portal routes are in `apps/api/app/routes/target_portals.py` and semester listing is currently restricted to ADMIN/MANAGER.
- Frontend is Next.js 16 + React 19 + TypeScript + TanStack Query; Manager already has `SemesterProvider`, `SemesterSwitcher`, URL context, and `AppShell.headerExtra`.
- Lecturer invitations and sessions currently expose round fields but not semester fields; supervised-projects already receives `semesterId`/`semesterCode`, but the FE adapter drops them.
- The product hierarchy is `Semester -> Evaluation Round -> Session/Invitation/Availability`; the Lecturer spec requires Semester on invitations and Round/Role/Date filters on My Schedule.

## Design Decision

Use a Lecturer-scoped semester catalog and a shared semester-context abstraction.

1. Add `GET /api/v1/lecturer/me/semesters`, returning only semesters connected to the authenticated Lecturer through invitations, scheduled sessions, supervised projects, or remediation cases.
2. Add `semesterId` filtering and semester metadata to Lecturer portal responses where needed.
3. Generalize the existing Manager `SemesterProvider`/`SemesterSwitcher` into reusable presentation/context code, while preserving Manager imports through compatibility exports.
4. Mount the provider in `app/(lecturer)/layout.tsx` and pass the switcher through `AppShell.headerExtra`; persist the selected semester as `?semester=SU26` and `lecturer:lastSemesterId`.
5. Default to the accessible ACTIVE semester when no URL/storage selection exists; if the Lecturer has no accessible ACTIVE semester, select the latest related semester. If no accessible semester exists, show an explicit empty state rather than silently loading mixed data.

## Alternatives Rejected

- **Display-only semester badges:** low effort but does not let Lecturer switch or filter historical semesters.
- **Separate selector on every page:** duplicates state and creates inconsistent navigation/query behavior.
- **Reuse `GET /semesters` directly:** rejected because its backend permission is intentionally ADMIN/MANAGER-only and it exposes management-oriented fields.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Lecturer semester API and contract](./phase-01-lecturer-semester-api-and-contract.md) | Completed |
| 2 | [Shared semester context and Lecturer header UI](./phase-02-shared-semester-context-and-header-ui.md) | Completed |
| 3 | [Semester-scoped Lecturer portal data](./phase-03-semester-scoped-lecturer-portal.md) | Completed |
| 4 | [Integration verification and generated contracts](./phase-04-integration-verification.md) | In progress |

## Related Repositories and Files

### Backend

- Modify `W:/f-caps-schedule/f-caps-schedule-be/apps/api/app/routes/target_portals.py`
- Modify `W:/f-caps-schedule/f-caps-schedule-be/apps/api/app/response_models.py`
- Modify `W:/f-caps-schedule/f-caps-schedule-be/apps/api/openapi.json` via the existing export script
- Add/modify Lecturer portal contract tests under `W:/f-caps-schedule/f-caps-schedule-be/apps/api/tests/`

### Frontend

- Modify `app/(lecturer)/layout.tsx`
- Extract/reuse `app/(manager)/manager/_shared/semester-context.tsx`
- Extract/reuse `app/(manager)/manager/_shared/semester-switcher.tsx`
- Modify `components/layout/app-shell.tsx` only if shared header behavior needs a small contract adjustment
- Modify `hooks/lecturer/useLecturerPortal.ts`
- Modify `lib/api/services/fetchLecturerPortal.ts`
- Modify Lecturer invitation, availability, schedule, supervised-groups, and remediation consumers
- Regenerate `lib/api/generated/openapi.json` and `lib/api/generated/schema.d.ts`

## Scope Boundary

In scope:

- Lecturer-visible semester catalog.
- Header switcher and URL/session persistence.
- Semester filtering for Lecturer portal data.
- Semester labels/grouping in round-based Lecturer UI.
- OpenAPI/typegen synchronization and regression tests.

Out of scope:

- Changing Manager semester behavior or Manager permissions.
- Adding Lecturer semester CRUD or lifecycle actions.
- Changing scheduling, invitation, or semester business rules.
- Adding a new database table; existing semester/round relationships are sufficient.
- Reworking the Lecturer dashboard mock content beyond replacing semester-sensitive display data.

## Acceptance Criteria

- [x] Lecturer sees the selected semester in the top-right header on desktop and mobile.
- [x] The switcher defaults to the accessible ACTIVE semester, falls back to the latest related semester, and persists selection in URL/storage.
- [x] Lecturer can switch between every semester returned by the scoped catalog without seeing unrelated semesters.
- [x] Invitations, availability rounds, sessions, supervised projects, and remediations are filtered by the selected semester.
- [x] Every displayed round has an unambiguous semester context; no round from another semester leaks into the selected view.
- [x] Existing Manager semester behavior and route query propagation remain unchanged.
- [x] BE OpenAPI and FE generated schema hashes match after typegen.
- [x] Backend contract tests, FE tests, typecheck/lint, and production build pass.

## Dependencies and Risks

- The Lecturer-scoped semester endpoint must be implemented before the FE provider can safely load options.
- The provider extraction must preserve existing Manager imports and semantics; use compatibility re-exports or update all imports atomically.
- A Lecturer may have no relation to a historical semester; the UI must distinguish “no accessible semester” from “API error.”
- Empty `semesterId` must not trigger an unscoped request that mixes all semesters.
- Generated OpenAPI must be exported from BE before FE typegen; otherwise CI contract SHA validation will fail.

## Execution Order

Phase 1 blocks Phases 2 and 3. Phase 2 supplies the selected context to all Lecturer pages. Phase 3 wires each data consumer. Phase 4 is the release gate.

## Next Step

Implementation complete for Phases 1–3. Phase 4 remains in progress until a browser smoke test is run with two related semesters; then mark the plan completed.

## Validation Log

### Verification Results

- **Tier:** Standard (Fact Checker + Contract Verifier)
- **Claims checked:** 36
- **Verified:** 33 | **Failed:** 0 | **Unverified:** 3
- **Evidence:** Lecturer portal routes, response models, Manager semester context/switcher, `AppShell.headerExtra`, all listed Lecturer pages/hooks/services, backend OpenAPI export script, and FE typegen/build/test scripts exist in the current repositories.

#### Unverified or implementation-dependent items

1. The new `GET /api/v1/lecturer/me/semesters` endpoint does not exist yet; its SQL relation query must be implemented and tested.
2. The exact shared-module extraction/re-export location is a design choice; current Manager imports are used by 10 consumers and must remain compatible.
3. Browser verification with multiple semesters requires deployed/test data and cannot be proven from static source inspection.

#### Contract Verifier finding

- `useLecturerInvitations` is consumed by `components/layout/app-shell.tsx` in addition to the invitations and availability pages. Phase 3 must include this caller when adding the selected-semester argument; otherwise the Lecturer header's pending-invitation badge could remain unscoped.

### Session 1 — 2026-08-26

**Trigger:** `/hs:plan validate W:/f-caps-schedule/f-caps-schedule-fe/plans/260826-lecturer-semester-context`
**Questions asked:** 1

#### Questions & Answers

1. **[Assumptions]** If a Lecturer has no data in the globally ACTIVE semester, how should the Lecturer semester context behave?
   - Options: Only related semesters; prefer accessible ACTIVE, otherwise latest related (Recommended) | Only related semesters; require manual selection | Always select global ACTIVE, even when no Lecturer data exists
   - **Answer:** Only related semesters; prefer accessible ACTIVE, otherwise latest related (Recommended)
   - **Rationale:** Keeps the context relevant to the Lecturer while avoiding an empty default when the Lecturer only has historical assignments.

#### Confirmed Decisions

- The semester catalog is Lecturer-scoped, not the full Manager/admin catalog.
- Default selection is accessible ACTIVE, then latest related semester.
- No accessible semester produces an explicit empty state.
- `components/layout/app-shell.tsx` is a required consumer when scoping the pending-invitation badge.

#### Action Items

- [x] Confirm default behavior when the Lecturer has no related ACTIVE semester.
- [x] Add `components/layout/app-shell.tsx` explicitly to Phase 3's affected consumers for the scoped invitation badge.

#### Impact on Phases

- Phase 2: Provider selection logic must use accessible ACTIVE, then latest related semester.
- Phase 3: AppShell's pending-invitation query must receive the selected semester context.

### Whole-Plan Consistency Sweep

- **Files reread:** `plan.md`, `phase-01-lecturer-semester-api-and-contract.md`, `phase-02-shared-semester-context-and-header-ui.md`, `phase-03-semester-scoped-lecturer-portal.md`, `phase-04-integration-verification.md`
- **Decision deltas checked:** 2
- **Reconciled stale references:** 3
- **Unresolved contradictions:** 0

## Implementation Log

- Phase 1: added Lecturer-scoped semester catalog and `semesterId` filtering for invitations, sessions, supervised projects, and remediations; added semester metadata to round-based responses.
- Phase 2: extracted reusable semester context/switcher, preserved Manager compatibility imports, and mounted Lecturer selector in the shared right-aligned header with role-specific session storage.
- Phase 3: scoped Lecturer React Query keys and API calls, preserved semester metadata in adapters, added semester labels to Lecturer views, and scoped the AppShell invitation badge.
- Documentation: added `W:/f-caps-schedule/f-caps-schedule-be/docs/api/lecturer-semester-context.md`.

## Verification Log

- Backend: `uv run ruff check app tests` passed.
- Backend: `uv run pytest -m "not integration" -q` passed.
- Frontend: `npm test -- --run` passed (7 tests).
- Frontend: `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed.
- Contract: BE and FE generated OpenAPI SHA256 both equal `b3cabd160baa4084f3e16f6f2a3e765b547c6346afaadfd9f3a3770c7a35b624`.
- Remaining verification: browser smoke test with two related semesters and a Manager smoke test require a running environment with suitable data.
