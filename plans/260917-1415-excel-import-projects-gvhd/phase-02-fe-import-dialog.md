---
phase: 2
title: "FE: update import dialog/service/hook for new contract"
status: completed
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: FE — update import dialog/service/hook

## Overview

Update the FE side of `POST /projects/import` to match Phase 1's new contract: send `semesterId`, update the template guide shown in the dialog, and surface the new `updated` count.

## Requirements

- Functional: `ImportProjectsDialog` sends the currently-selected semester's id; template guide reflects the real columns (Mã đề tài, Mã nhóm, Tên đề tài EN/JP, Tên đề tài VI, GVHD, GVHD1, GVHD2 — not semesterCode/majorCode/topicType).
- Non-functional: keep the existing dialog UX shape (drag-drop upload → result summary), no new dialog needed.

## Architecture

```
projects-page.tsx (has currentSemester.id already, used by useProjects/CreateProjectDialog)
  -> ImportProjectsDialog now takes `semesterId` (number) instead of `currentSemesterCode` (string)
       -> useImportProjects(semesterId) hook
            -> fetchProjects.importFile(file, semesterId)
                 -> POST api/v1/projects/import?semesterId=... (multipart)
```

## Related Code Files

- Modify: `lib/api/services/fetchProjects.ts` (`importFile`, `ProjectImportResponse` interface)
- Modify: `hooks/manager/useProjects.ts` (`useImportProjects`)
- Modify: `components/projects/import-projects-dialog.tsx` (`TEMPLATE_COLUMNS`, `ImportProjectsDialog` props, `ResultSummary`, `ERROR_CODE_LABEL`)
- Modify: `app/(manager)/manager/projects/components/projects-page.tsx` (pass `semesterId` instead of `currentSemesterCode`)
- Regenerate: `lib/api/generated/openapi.json`, `lib/api/generated/schema.d.ts` (`npm run typegen -- ../f-caps-schedule-be/apps/api/openapi.json`, after Phase 1's BE contract is regenerated)

## Implementation Steps

1. `fetchProjects.ts`: change `importFile(file: File)` → `importFile(file: File, semesterId: number)`, add `semesterId` as a query param on the upload call (mirror how `fetchScheduling.run` passes `semesterId`). Add `updated: number` to `ProjectImportResponse`.
2. `useProjects.ts`: `useImportProjects()` → `useImportProjects(semesterId: number | undefined)`, mutationFn passes both args through; keep existing invalidation logic.
3. `import-projects-dialog.tsx`:
   - `TEMPLATE_COLUMNS`: remove `semesterCode`, `majorCode`, `topicType` rows; add `groupCode` (required, example `GSU26SE01`), `gvhd`/`gvhd1` (required, example a real lecturer_code format), `gvhd2` (optional).
   - Props: replace `currentSemesterCode?: string` with `semesterId?: number`; disable the Import button (or show a blocking message) when `semesterId` is undefined, matching how other manager dialogs handle "no semester selected".
   - `handleImport`: pass `semesterId` through to `mutate`.
   - `ERROR_CODE_LABEL`: replace `SEMESTER_OR_MAJOR_NOT_FOUND` with the new row error codes from Phase 1 (`GVHD_NOT_FOUND`, `GROUP_CODE_MISMATCH`, `REQUIRED_FIELD_MISSING` stays).
   - `ResultSummary`: add an `updated` count line alongside `created`/`skipped`.
4. `projects-page.tsx`: change the `ImportProjectsDialog` usage to pass `semesterId={currentSemester?.id}` instead of `currentSemesterCode={currentSemesterId ?? undefined}`.
5. Regenerate FE generated contract types from the Phase-1-updated BE `openapi.json`.

## Success Criteria

- [x] `ProjectImportResponse` (FE) has `updated: number`.
- [x] Dialog sends `semesterId` with the upload request.
- [x] Template guide table shows Mã đề tài/Mã nhóm/2 titles/GVHD/GVHD2 (GVHD1 folded into "GVHD" per confirmed rule), no semesterCode/majorCode/topicType.
- [x] Template guide includes a Department row (added in round 2, after real-file testing revealed the BE now reads it — "blank keeps existing major" documented in the note).
- [x] Result summary shows created/updated/skipped counts.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass.
- [x] `npm run typegen:check -- ../f-caps-schedule-be/apps/api/openapi.json` passes (generated contract matches byte-for-byte).
- [x] `npm run build` (production build) succeeds, `/manager/projects` route compiles.
- [x] Dialog copy (description + footer hint) updated to match actual upsert behavior (was stale from the old template, flagged by code review).
- [x] `GVHD_DUPLICATE` error label added (new BE row-error code from Phase 1's post-review fixes).

## Risk Assessment

- Low risk, purely additive/renamed props within one dialog + its direct callers. No shared component affected.
- Rollback: revert the 4 file changes; no backend coupling beyond the already-versioned API contract.
