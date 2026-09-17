---
status: completed
created: 2026-09-17
brainstorm: ../reports/brainstorm-260917-1415-excel-import-projects-gvhd.md
blockedBy: []
blocks: []
---

# Plan: Fix Excel project import to support Mã nhóm + GVHD

## Status

completed

## Summary

The live `POST /api/v1/projects/import` endpoint (and its shipped FE dialog on `manager/projects`) only imports project code/title/topicType, requiring `semesterCode`/`majorCode` as sheet columns and skipping on duplicate codes. The user's real Excel sheet (Mã đề tài, Mã nhóm, Tên đề tài EN/JP, Tên đề tài VI, Department, GVHD, GVHD1, GVHD2, Submit, Conflict, Final Score, Final Result) doesn't match this template at all — no group creation, no supervisor assignment.

Fix the existing endpoint (not a new one) to: read semester from a query param, fix major to `SE`, drop Department/Submit/Conflict/Final Score/Final Result entirely, create an empty `groups` row per `Mã nhóm`, assign `project_supervisors` (MAIN=GVHD/GVHD1, CO=GVHD2) matched by `lecturer_code`, and upsert on duplicate project code instead of skipping. Update the FE dialog/service/hook to match.

Full rationale, scout findings, alternatives considered: [brainstorm report](../reports/brainstorm-260917-1415-excel-import-projects-gvhd.md).

## Phases

| Phase | Name | Status | Priority | Dependencies |
| ----- | ---- | ------ | -------- | ------------ |
| 1 | BE: fix `/projects/import` (group + GVHD + upsert) | completed | P1 | none |
| 2 | FE: update import dialog/service/hook for new contract | completed | P1 | Phase 1 |

See [phase-01-be-import-endpoint.md](./phase-01-be-import-endpoint.md), [phase-02-fe-import-dialog.md](./phase-02-fe-import-dialog.md).

## Dependencies

None — no other plan touches `manager_extensions.py` or `import-projects-dialog.tsx`.

## Acceptance Criteria

- [x] `POST /api/v1/projects/import?semesterId={id}` reads: Mã đề tài, Mã nhóm, Tên đề tài Tiếng Anh/Tiếng Nhật, Tên đề tài Tiếng Việt, GVHD, GVHD1, GVHD2. Ignores STT, Department, Submit, Conflict, Final Score, Final Result.
- [x] Per row: upserts `projects` (major fixed to `SE`), creates `groups` row (empty, no members) for the project if not already present, upserts `project_supervisors` MAIN=GVHD/GVHD1, CO=GVHD2 (if present), matched via `lecturers.lecturer_code` (normalized, case-insensitive).
- [x] Row with unmatched/missing GVHD1, missing Mã đề tài/Mã nhóm, or missing both titles is skipped with a row-level error; rest of the batch still processes.
- [x] Re-uploading the same file updates existing rows (upsert), not duplicate-error.
- [x] FE `ImportProjectsDialog` template guide shows the new columns, sends `semesterId` from the page's `SemesterProvider` context, result summary shows `created`/`updated`/`skipped`/errors.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` (FE) pass. BE: `python -c "import app.main"` clean, real `TestClient` round-trip via `tests/test_project_import.py` (4/4 passing) plus manual `X-Test-Session` HTTP verification against local DB.

## Post-review note (important)

The mandatory code-review pass (run before finalizing, per team workflow) caught a **blocking defect the initial manual verification missed**: the first implementation raised `InvalidRequestError` on every single request (calling `db.execute()` before `db.begin()` on a SQLAlchemy session that autobegins). Manual SQL-only testing via `psql` didn't catch it because it bypassed the Python session layer entirely. Fixed, empirically re-verified via a real HTTP round-trip, and a regression test suite (`tests/test_project_import.py`) added — this is exactly the gap the test suite now closes. See phase-01 for full details of this and the other review findings (H1/H2/M1/M3 fixed, M2/M4/M5 deferred with reasons).

## Links

- Brainstorm report: [../reports/brainstorm-260917-1415-excel-import-projects-gvhd.md](../reports/brainstorm-260917-1415-excel-import-projects-gvhd.md)
