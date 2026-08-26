---
phase: 4
title: "Portal, import, and verification"
status: completed
priority: P1
effort: "4h"
dependencies: [1, 2, 3]
---

# Phase 4: Portal, Import, and Verification

## Context Links

- Lecturer portal service: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturerPortal.ts`
- Lecturer supervised UI: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/supervised-groups/**`
- Import dialog: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/import-lecturers-dialog.tsx`
- Import hook: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/useLecturers.ts`
- FE scripts: `W:/f-caps-schedule/f-caps-schedule-fe/package.json`

## Overview

Finish secondary consumers and verify the feature end-to-end at the FE contract, UI, and build levels.

## Requirements

- Lecturer supervised-project cards/table display topic type when present, with `REGULAR` fallback.
- Import guidance documents the optional seniority column and accepted values without breaking the existing four-column template.
- Import result types can display the imported seniority when the backend returns it.
- Verification covers old responses, null values, invalid values, loading, and API errors.

## Architecture

Keep import backward-compatible: the existing template remains valid, while the UI describes an optional fifth column for seniority. The adapter maps the backend's flat supervised-project row into the existing UI model and carries topic type alongside title/status. No new global state is needed.

Validation layers:

1. Type contract: generated schema and service interfaces.
2. Unit/contract tests: metadata, serialization, null/fallback behavior.
3. Static/build checks: TypeScript, ESLint, Next build.
4. Manual QA: create/edit/display/import flows against a backend with migration 0044 applied.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturerPortal.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/supervised-groups/components/group-row.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/lecturer/supervised-groups/components/groups-table.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/import-lecturers-dialog.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/useLecturers.ts`
- Create/modify tests alongside affected services/components according to existing Vitest conventions.

## Implementation Steps

1. Add `topicType` to supervised-project API/model/adaptor and render the shared topic label in both responsive row and table variants.
2. Update import dialog copy to identify the optional seniority column, accepted values, and `Chưa xét` behavior.
3. Add seniority to import result types/table only if returned; keep temporary-password copy behavior unchanged.
4. Add contract tests for metadata, legacy fallback, null display, and import DTO compatibility.
5. Run `npm run typegen`, `npx tsc --noEmit`, `npm run lint`, `npm run test`, and `npm run build`.
6. Manually verify network payloads and UI states against the migrated backend:
   - project create/update sends `topicType`;
   - lecturer create/update sends `seniorityLevel` or explicit `null`;
   - old project rows show `REGULAR`;
   - import accepts the old template and the optional fifth column;
   - unauthorized users cannot see management edit controls.

## Todo List

- [x] Display topic type in supervised groups.
- [x] Update import guidance and result types.
- [x] Add fallback/null/metadata contract tests.
- [x] Run all FE quality gates.
- [ ] Perform API/network smoke test after backend migration (requires a running migrated backend session).

## Success Criteria

- Lecturer portal never crashes when topic type is absent and clearly shows the project type when present.
- Existing lecturer import files remain accepted.
- All automated quality gates pass.
- Manual smoke test confirms payload casing and null semantics.

## Risk Assessment

- Existing comments describe the supervised-project response as a contract gap; update only the affected comment and keep null fallbacks for unrelated missing fields.
- The import template may be maintained outside the FE repo; document the optional column rather than requiring a new file in this plan.
- Full manual verification needs a running backend/database with migration 0044 and valid credentials; separate environment failure from FE failures.

## Security Considerations

Do not expose temporary passwords beyond the existing one-time result behavior. Display-only topic/seniority metadata must not become an authorization signal.

## Next Steps

After completion, the implementation is ready for manual API/network smoke testing against a running backend with migration 0044 applied.
