---
phase: 1
title: "BE: fix /projects/import (group + GVHD + upsert)"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: BE — fix `/projects/import`

## Overview

Rewrite the body of `import_projects` (`apps/api/app/routes/manager_extensions.py:1237-1288`) to match the real Excel template: read `semesterId` from a query param instead of a sheet column, fix major to `SE`, add group creation and GVHD/GVHD1/GVHD2 supervisor assignment by `lecturer_code`, and upsert projects instead of skipping duplicates.

Repo: `W:\f-caps-schedule\f-caps-schedule-be` (sibling repo, not this FE repo — plan lives in FE per project convention, work happens in BE).

## Requirements

- Functional: import creates/updates Project + empty Group + up to 2 `project_supervisors`, per row, tolerating individual row failures.
- Non-functional: reuse existing `_workbook_rows` header-normalization helper (no new parsing layer); reuse `normalize_code` for lecturer_code matching; keep the existing `ImportFile`/multipart contract (only add a query param).

## Architecture

Existing helpers already do the header normalization needed — `_normalise_header` turns "Mã đề tài" → `madetai`, "Tên đề tài Tiếng Việt" → `tendetaitiengviet` (already the key the old code reads), "Tên đề tài Tiếng Anh/ Tiếng Nhật" → `tendetaitienganhtiengnhat` (already read), "Mã nhóm" → `manhom` (new), "GVHD"/"GVHD1"/"GVHD2" → `gvhd`/`gvhd1`/`gvhd2` (new). No changes needed to `_workbook_rows` itself.

```
POST /api/v1/projects/import?semesterId=123
  -> _require(user, "ADMIN", "MANAGER")
  -> semester_id from query param (int, required) — 422 if missing/not found
  -> major_id = lookup majors WHERE code = 'SE' once, before the row loop — 500-class error if missing (should always exist)
  -> sheets = _workbook_rows(file); rows = first sheet's rows (same as today)
  -> for each row:
       code = madetai; group_code = manhom
       title_vi = tendetaitiengviet; title_en = tendetaitienganhtiengnhat
       gvhd1_code = normalize_code(gvhd1 or gvhd); gvhd2_code = normalize_code(gvhd2) if present
       validate: code, group_code, (title_vi or title_en), gvhd1_code all required -> else row error, continue
       lookup lecturer ids for gvhd1_code (required) and gvhd2_code (optional) by lecturers.lecturer_code
         -> missing match => row error "GVHD_NOT_FOUND", continue (don't guess)
       upsert projects (semester_id, major_id, code, title, title_vi, title_en) ON CONFLICT (semester_id, code) DO UPDATE
         -> track created vs updated via `xmax = 0` trick or a pre-check SELECT
       ensure groups row exists for that project_id + group_code (INSERT ... ON CONFLICT (project_id, code) DO NOTHING;
         groups.project_id is UNIQUE so a project can only ever have one group — if a different group_code already
         exists for this project_id, that's a row error, don't silently overwrite)
       replace project_supervisors for project_id: DELETE existing rows for project_id, INSERT MAIN (gvhd1) and CO (gvhd2 if present)
  -> single audit_events row summarizing the batch (matches import_lecturers' pattern)
  -> return {created, updated, skipped, errors}
```

Row-level isolation: wrap each row's writes in `db.begin_nested()` (savepoint) like `import_lecturers`/`import_groups` already do, so one bad row doesn't roll back the whole batch.

**Upsert vs `groups.project_id` UNIQUE constraint**: since a project can have at most one group, re-importing the same project with a *different* group code is ambiguous — treat it as a row error (`GROUP_CODE_MISMATCH`) rather than silently changing the group. Re-importing with the *same* group code is a no-op (`ON CONFLICT DO NOTHING`).

## Related Code Files

- Modify: `apps/api/app/routes/manager_extensions.py` (`import_projects` function, ~line 1237)
- Modify: `apps/api/app/response_models.py` (add `ProjectImportResponse(ImportResponse)` with `updated: int = 0`, mirroring `LecturerImportResponse`/`AccountImportResponse`)
- Regenerate: `apps/api/openapi.json` (`python tools/openapi_export.py`, or the inline one-liner used earlier this session if `git` isn't available inside the container — see phase 2 for the paired FE `npm run typegen`)

## Implementation Steps

1. Add `ProjectImportResponse(ImportResponse)` to `response_models.py` with `updated: int = 0`.
2. Change the route decorator: `@router.post("/projects/import", ..., response_model=ProjectImportResponse)`.
3. Add `semester_id: Annotated[int, Query(alias="semesterId")]` parameter to `import_projects`.
4. Look up `major_id` for code `SE` once before the loop (reuse the exact pattern already in the function for semester/major lookups, just fixed to `"SE"` instead of reading `majorcode` from the row).
5. Replace the per-row field extraction: drop `semestercode`/`majorcode`/`topictype` reads, add `manhom`, `gvhd`, `gvhd1`, `gvhd2` reads (GVHD1 falls back to GVHD per the confirmed "GVHD = GVHD1" business rule).
6. Add lecturer lookups by normalized `lecturer_code` for gvhd1 (required) and gvhd2 (optional); row error `GVHD_NOT_FOUND` with the offending code in the message if unmatched.
7. Change the project INSERT to `INSERT ... ON CONFLICT (semester_id, code) DO UPDATE SET title=..., title_vi=..., title_en=... RETURNING id, (xmax = 0) AS inserted` to distinguish created vs updated in one round-trip.
8. Add the group upsert (`ON CONFLICT (project_id, code) DO NOTHING`) with the mismatch check described above.
9. Add `DELETE FROM project_supervisors WHERE project_id = :id` then re-insert MAIN/CO (mirrors `apply_projects()` in `tools/import_projects_sheet.py`).
10. Keep `topic_type` defaulted to `REGULAR` (column dropped from input; DB default already handles this, no need to pass it explicitly if the INSERT omits the column — verify the upsert SQL still works with the column omitted vs explicit REGULAR).
11. Update the single audit_events call to include the new counts.
12. Regenerate `apps/api/openapi.json`.

## Success Criteria

- [x] `ProjectImportResponse` added with `updated` field.
- [x] Endpoint requires `semesterId` query param (404 `SEMESTER_NOT_FOUND` via `ensure_semester_writable` if absent from DB).
- [x] Major always resolves to `SE`; no `majorcode` read from the sheet.
- [x] Row with valid Mã đề tài/Mã nhóm/title/GVHD1 creates Project + Group + ≥1 `project_supervisors` row — verified via real HTTP round-trip (`TestClient` + `X-Test-Session`) and via `tests/test_project_import.py`.
- [x] Row with unmatched GVHD1 code is skipped with a row error, doesn't abort the batch.
- [x] Row with GVHD2 present and matched creates a second `project_supervisors` row with type CO.
- [x] Re-running the same file updates existing projects/supervisors instead of erroring (verified: created=1→0, updated=0→1 on second call).
- [x] Re-running with a changed group code for an existing project produces a row error, not a silent group swap.
- [x] `python -c "import app.main"` succeeds.
- [x] `apps/api/openapi.json` regenerated.

## Post-review fixes (code-reviewer subagent found a blocking defect)

The mandatory code review caught issues the manual SQL-only verification couldn't — the bug was in Python/SQLAlchemy session handling, not the SQL itself:

- **CRITICAL (fixed):** the first implementation called `db.execute(...)` (semester/major lookups) *before* `with db.begin():`. SQLAlchemy's `Session` autobegins a transaction on the first `execute()`; calling `db.begin()` afterward raised `InvalidRequestError: A transaction is already begun on this Session` — **the endpoint 500'd on every single call**. Reproduced empirically (both a minimal repro script and the real route via `TestClient`), then fixed by moving `ensure_semester_writable` + the major lookup to be the *first* DB interaction, inside `with db.begin():` (matches the pattern already used by `create_project` elsewhere in the same file). Dropped the now-redundant manual semester-existence check (`ensure_semester_writable` already 404s).
- **High (fixed):** project/group codes weren't normalized (`normalize_code`), unlike the lecturer-code lookup — a case-mismatched re-import would have silently created a duplicate project instead of upserting. Fixed.
- **High (fixed):** blank title cells were written as `''` instead of `NULL` (breaks `COALESCE`/`NULLIF` title-fallback logic used elsewhere), and the upsert unconditionally overwrote existing titles even with a blank cell. Fixed: `title_vi`/`title_en` now `None` when blank, upsert uses `COALESCE(EXCLUDED.x, projects.x)` so a blank cell preserves the existing value instead of wiping it.
- **Medium (fixed):** GVHD == GVHD2 on the same row would hit a PK violation and abort the whole row with an opaque error (existing `project_supervisors_pkey` is `(project_id, lecturer_id)`) — added an explicit `GVHD_DUPLICATE` row error instead.
- **Medium (fixed):** swallowed exceptions logged now (`logging.exception`) instead of silently converting to a generic row error with no trace.
- **Medium (fixed):** N+1 lecturer lookups — preloaded `{UPPER(lecturer_code): id}` once before the row loop instead of querying per GVHD cell.
- **Added (was missing):** `tests/test_project_import.py` — 4 `TestClient` tests (create, upsert-on-rerun, unmatched-GVHD-skips-not-fatal, role guard) using the existing `X-Test-Session` test seam. This is what should have caught the transaction bug before review; added per reviewer recommendation.
- **Deferred (medium, not blocking):** file size/row-count cap (sibling `_lecturer_import_rows` has 5MB/2000-row limits, `_workbook_rows` used here has none — pre-existing gap shared with `import_groups`, not introduced by this change); exact Excel row numbers in error messages (`_workbook_rows` drops blank rows before indexing, so a blank row mid-sheet shifts subsequent row numbers — fixing requires changing the shared `_workbook_rows` helper, which also feeds `import_groups`, judged out of scope for this fix); confirming the real user workbook's header is actually on row 1 (needs the user's real file, can't verify blind).

## Risk Assessment

- **Breaking change to existing template.** The old `semesterCode`/`majorCode`/`topicType` sheet columns stop being read. Low risk per brainstorm scout — no real file was ever confirmed working against the old template.
- **`groups.project_id` UNIQUE constraint** means this import can never give a project a second group — confirmed intentional by schema, handled as a row error on mismatch (see Architecture).
- Rollback: revert the function + response model + test file changes; no migration involved (no schema change).
