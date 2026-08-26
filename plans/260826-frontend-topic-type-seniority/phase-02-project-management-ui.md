---
phase: 2
title: "Project management UI"
status: completed
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Project Management UI

## Context Links

- Project list/create: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/projects/components/projects-page.tsx`
- Project detail: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/projects/[projectId]/components/project-detail-page.tsx`
- Project hooks: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/manager/useProjects.ts`
- Existing FE spec: `W:/f-caps-schedule/f-caps-schedule-fe/docs/capstone-fe-be-implementation-spec.md` sections 16–18

## Overview

Add topic type to project creation, editing, list, and detail flows while retaining the current supervisor and progression behavior.

## Requirements

- Create form defaults to `REGULAR` and submits the selected `topicType`.
- Existing project edit dialog preserves supervisor editing and adds topic type editing.
- Project list shows a compact label/badge without making the table unusably wide.
- Project detail shows the label and description in the overview.
- Do not derive project status or eligibility from topic type.
- Do not add a client-side topic filter because the current backend list contract does not expose one.

## Architecture

Use `TOPIC_TYPE_OPTIONS` from Phase 1 in the create/edit `Select`. Use `TOPIC_TYPE_META[project.topicType]` for table/detail display. Keep React Query mutation invalidation unchanged; the existing project query keys remain the cache boundary.

For update payloads, send `topicType` only when the user has selected/changed a value. For create, send an explicit value so the UI behavior is deterministic even if the backend default changes later.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/projects/components/projects-page.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/manager/projects/[projectId]/components/project-detail-page.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/manager/useProjects.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchProjects.ts` (from Phase 1)
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(manager)/_shared/labels.ts` only if existing status presentation needs a shared import boundary

## Implementation Steps

1. Add `topicType` state to the create dialog, defaulting to `REGULAR`, with four options and descriptions.
2. Add a topic type column or secondary metadata line to the project table; verify responsive behavior and preserve current horizontal-scroll strategy.
3. Add topic type state to the existing project edit dialog, initializing from the selected project and preserving supervisor values.
4. Call `useUpdateProject` with `topicType` while retaining current success/error toasts and cache invalidation.
5. Add topic type metadata to the project detail overview and progression header only where it improves context; avoid duplicating it in every tab.
6. Add component/service tests for default selection, each enum value, and update payload serialization.

## Todo List

- [x] Add create select with default `REGULAR`.
- [x] Add list badge/label.
- [x] Add edit support without losing supervisor changes.
- [x] Add detail display.
- [x] Preserve existing mobile/table overflow and loading/error states.
- [x] Verify through typecheck, lint, unit tests, and production build.

## Success Criteria

- A manager can create a project with any supported topic type.
- A manager can change a project topic type without changing its supervisors.
- Existing projects with missing/legacy metadata display as `Đề tài thường`.
- Status/progression rendering remains unchanged.

## Risk Assessment

- Dialog state can retain a prior project's value when switching rows; use the existing keyed-dialog pattern or reset on project identity change.
- Adding a table column can worsen narrow-screen usability; prefer compact badge/secondary line and retain the existing overflow behavior.
- The old FE spec omits the new field; document the backend OpenAPI source as authoritative in code comments where needed.

## Security Considerations

No new authorization. The UI must surface backend 403/422 errors through the existing API error/toast path and must not infer editability from project status alone.

## Next Steps

Lecturer management UI and portal/import work are complete in the dependent phases.
