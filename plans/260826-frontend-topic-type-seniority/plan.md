---
title: "Implement Topic Type and Lecturer Seniority in FE"
description: "Expose project topic type and lecturer seniority across the existing Next.js management and lecturer flows."
status: completed
priority: P1
effort: 2d
branch: feature/scheduling-algorithm-config
tags: [feature, frontend, api]
blockedBy: []
blocks: []
created: 2026-08-26
---

# Implement Topic Type and Lecturer Seniority in FE

## Overview

Expose the backend fields `topicType` and `seniorityLevel` in the existing FE flows without changing the scheduling domain or introducing a parallel data model.

The backend migration and API contract are already implemented. FE will consume the committed backend OpenAPI spec, keep wire names camelCase, and preserve legacy defaults: `topicType = REGULAR`, `seniorityLevel = null`.

## Cross-Plan Dependencies

No direct file overlap with `plans/260822-2117-fix-manager-api-request-guards/`. Preserve its pending changes if both plans are implemented in the same worktree.

## Design Decision

Use one shared metadata registry for labels, descriptions, and option ordering. Keep service DTOs explicit and normalize missing legacy `topicType` to `REGULAR`; do not add a generic form framework or client-side business rules.

Alternatives considered:

- Display-only: lowest effort, but leaves create/update/import flows inconsistent.
- Full FE integration: recommended; completes the already-deployed backend contract with bounded scope.
- New metadata/admin configuration screen: rejected as YAGNI; values are fixed enums, not runtime configuration.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [API contract and shared metadata](./phase-01-api-contract-and-shared-metadata.md) | Completed |
| 2 | [Project management UI](./phase-02-project-management-ui.md) | Completed |
| 3 | [Lecturer management UI](./phase-03-lecturer-management-ui.md) | Completed |
| 4 | [Portal, import, and verification](./phase-04-portal-import-and-verification.md) | Completed |

## Dependencies

- Backend migration `0044_project_topic_lecturer_seniority` applied in the target environment.
- Backend OpenAPI source: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/openapi.json`.
- Existing Next.js 16, React 19, TypeScript, TanStack Query, shadcn-style UI components.
- Existing manager API guard plan must retain its unrelated changes.

## Scope Boundary

In scope: types, labels, project create/update/list/detail, lecturer create/update/list/account-role assignment, lecturer import guidance/result, and lecturer supervised-project display.

Out of scope: backend changes, database changes, new filtering endpoints, scheduling algorithm changes, redesign of existing pages, and a runtime configuration screen for enum values.

## Acceptance Criteria

- All four topic types render with the agreed Vietnamese labels and descriptions.
- Project create and edit send `topicType`; list/detail/supervised views display it; omitted legacy values fall back to `REGULAR`.
- Lecturer create, account role assignment, edit, list, and import flows support `seniorityLevel`; `null` renders as `Chưa xét` and can be restored explicitly.
- Existing forms remain backward-compatible and do not submit `undefined` as an accidental enum value.
- Generated API artifacts are refreshed from the backend OpenAPI source.
- `npm run typegen`, `npx tsc --noEmit`, `npm run lint`, `npm run test`, and `npm run build` pass.

## Execution Order

Phase 1 is prerequisite for Phases 2–4. Phases 2 and 3 can be implemented independently after Phase 1. Phase 4 consumes the shared types and completes the integration verification.

## Risks

- Generated schema drift if typegen uses a stale backend spec; always run `npm run typegen` from the FE repo after the BE spec is available.
- `null` versus omitted update values can accidentally prevent clearing seniority; test both cases explicitly.
- Existing docs describe older contracts; treat the committed backend OpenAPI and live API response shape as authoritative for this feature.

## Validation Log

### Verification Results

- **Tier:** Standard (Fact Checker + Contract Verifier)
- **Claims checked:** 40
- **Verified:** 40 | **Failed:** 0 | **Unverified:** 0
- **Evidence:** All planned FE paths exist; project and lecturer hooks/services/consumers are present; the backend exposes `topicType`, `seniorityLevel`, `PATCH /lecturers/{lecturerId}`, and `GET /lecturer/me/supervised-projects`; `npm run typegen` and all listed quality-gate scripts exist.
- **Note:** `lib/utils/masterDataLabels.ts` is intentionally a planned new file, not an existing-path claim.

### Session 1 — 2026-08-26

**Trigger:** User requested `/hs:plan validate` for the FE implementation plan.
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Should project `topicType` be edited inside the existing project supervisor-edit dialog or in a separate dialog?
   - Options: Existing dialog (Recommended) | Separate topic-type dialog
   - **Answer:** Existing dialog (Recommended)
   - **Rationale:** Keeps project metadata and supervisor changes in one existing management flow without adding another action surface.

2. **[Compatibility]** Should lecturer import preserve the current four-column template and make `seniorityLevel` an optional fifth column?
   - Options: Preserve four columns + optional fifth column (Recommended) | Require a new five-column template
   - **Answer:** Preserve four columns + optional fifth column (Recommended)
   - **Rationale:** Existing files continue to work while new imports can populate seniority.

3. **[Scope]** Should `seniorityLevel` controls be limited to Admin/Manager screens rather than added to the lecturer portal?
   - Options: Admin/Manager only (Recommended) | Add lecturer self-service controls | Display in portal but do not edit
   - **Answer:** Admin/Manager only (Recommended)
   - **Rationale:** Seniority is management metadata and is not a lecturer self-service setting.

#### Confirmed Decisions

- Project topic type is edited in the existing project edit flow.
- Lecturer import remains backward-compatible with an optional fifth seniority column.
- Seniority management is restricted to Admin/Manager UI; lecturer portal remains display-only for project metadata.

#### Action Items

- [x] Keep the current phase structure and implementation scope.
- [x] Preserve the existing four-column lecturer import behavior.
- [x] Keep seniority edit controls out of lecturer portal routes.

#### Impact on Phases

- Phase 2: No change; existing project edit dialog remains the target.
- Phase 3: No change; management dialogs include seniority controls.
- Phase 4: No change; import remains backward-compatible and portal only displays topic type.

### Whole-Plan Consistency Sweep

- **Files reread:** `plan.md`, `phase-01-api-contract-and-shared-metadata.md`, `phase-02-project-management-ui.md`, `phase-03-lecturer-management-ui.md`, `phase-04-portal-import-and-verification.md`
- **Decision deltas checked:** 3
- **Reconciled stale references:** 0
- **Unresolved contradictions:** 0
- **Result:** Plan is internally consistent and eligible for implementation.

### Implementation Results — 2026-08-26

- [x] Generated OpenAPI artifacts refreshed with `npm run typegen`.
- [x] Shared topic/seniority metadata and legacy/null fallbacks implemented.
- [x] Project create/edit/list/detail/supervised-project flows implemented.
- [x] Lecturer create/update/list/import/account-role flows implemented.
- [x] Automated checks passed: typecheck, lint, Vitest (7 tests), production build, and `git diff --check`.
- Manual browser/network smoke test remains environment-dependent and was not run because no running migrated backend session was available.
