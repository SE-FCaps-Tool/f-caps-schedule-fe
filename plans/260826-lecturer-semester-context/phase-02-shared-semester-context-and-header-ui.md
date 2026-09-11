---
phase: 2
title: "Shared semester context and Lecturer header UI"
status: completed
priority: P1
effort: 5h
dependencies: [1]
---

# Phase 2: Shared Semester Context and Lecturer Header UI

## Overview

Reuse the Manager header pattern for Lecturer while keeping one source of truth for selected semester, URL persistence, and responsive rendering.

## Requirements

- Functional: render a right-aligned switcher via `AppShell.headerExtra`.
- Functional: persist `semester` query and restore the last selection from role-specific storage.
- UX: show ACTIVE status and accessible semester names/codes; support keyboard and mobile header use.
- Compatibility: Manager pages retain current `currentSemester` object and query behavior.

## Architecture

Extract the presentational switcher and provider into a shared semester module with a small normalized option type. Keep Manager-specific service loading and Lecturer-specific service loading behind provider configuration or adapters. Preserve old Manager import paths with re-exports if that reduces migration risk.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(lecturer)/layout.tsx`
- Modify/extract: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/_shared/semester-context.tsx`
- Modify/extract: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/_shared/semester-switcher.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/components/layout/app-shell.tsx` if needed
- Add: shared semester context/switcher module under `components/semesters/` or `lib/`

## Implementation Steps

1. Normalize manager and lecturer semester options to the fields required by the switcher.
2. Extract reusable provider/switcher behavior without changing Manager's route semantics.
3. Mount Lecturer provider in the Lecturer route layout and pass the switcher as `headerExtra`.
4. Use `lecturer:lastSemesterId` storage key so switching roles does not unexpectedly carry a Manager context.
5. Append `?semester=<code>` to Lecturer navigation links and reset dependent React Query data when it changes.
6. Select the accessible ACTIVE semester by default, fall back to the latest related semester, and add loading, empty, invalid-selection, and API-error states.

## Success Criteria

- [x] Header matches Manager's visual language and appears on desktop/mobile.
- [x] Refreshing or navigating between Lecturer pages preserves selected semester.
- [x] Manager tests/pages remain behaviorally unchanged.
- [x] No duplicate selector state exists per Lecturer page.

## Risk Assessment

Moving the Manager context can create broad import churn. Prefer a compatibility layer and verify every existing Manager consumer before deleting old files.
