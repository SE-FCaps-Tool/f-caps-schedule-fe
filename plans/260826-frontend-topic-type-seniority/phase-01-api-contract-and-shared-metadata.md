---
phase: 1
title: "API contract and shared metadata"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: API Contract and Shared Metadata

## Context Links

- Backend contract: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/openapi.json`
- FE generator: `W:/f-caps-schedule/f-caps-schedule-fe/scripts/typegen.mjs`
- FE API services: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchProjects.ts`, `fetchLecturers.ts`, `fetchLecturerPortal.ts`

## Overview

Align generated and hand-maintained FE DTOs with the backend wire contract, then centralize the fixed labels and descriptions used by all screens.

## Requirements

- Define `TopicType = APPLICATION | RESEARCH | INTEGRATED | REGULAR`.
- Define `LecturerSeniorityLevel = Senior | MidLevel | Junior | Rookie`, with nullable field semantics.
- Use wire names `topicType` and `seniorityLevel`.
- Preserve `REGULAR` fallback for responses from older data or incomplete fixtures.
- Keep generated files generated; do not hand-edit `lib/api/generated/schema.d.ts`.

## Architecture

`npm run typegen` copies the backend OpenAPI source into `lib/api/generated/openapi.json` and regenerates `schema.d.ts`. Manual service interfaces remain the ergonomic UI-facing layer. A shared `lib/utils/masterDataLabels.ts` (or equivalent existing utility location) exports typed option arrays and metadata:

```ts
TOPIC_TYPE_META[value] = { label, description }
LECTURER_SENIORITY_META[valueOrNull] = { label, description }
```

Forms use the option arrays; tables and detail views use the same registry, preventing label drift.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchProjects.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturers.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturerPortal.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchAccounts.ts`
- Modify/generated: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/generated/openapi.json`, `schema.d.ts`
- Create or modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/utils/masterDataLabels.ts`

## Implementation Steps

1. Run `npm run typegen` against the backend OpenAPI source and inspect the generated diff for only the new fields/enums.
2. Add shared literal types and metadata maps with exact Vietnamese labels/descriptions.
3. Extend project list/create/update/detail/progression service DTOs with `topicType` and default/normalization handling.
4. Extend lecturer list/create/update/import DTOs with nullable `seniorityLevel`; add the `PATCH /api/v1/lecturers/{lecturerId}` service method.
5. Extend account create and role-assignment payloads when the selected role is `LECTURER`.
6. Extend `SupervisedProjectApi` and its adapter with optional `topicType`, falling back to `REGULAR`.

## Todo List

- [x] Typegen from the current backend OpenAPI.
- [x] Add shared metadata and option ordering.
- [x] Update project, lecturer, account, and supervised-project service types.
- [x] Add null/legacy fallback and metadata contract tests.

## Success Criteria

- TypeScript consumers can access `project.topicType` and `lecturer.seniorityLevel` without `any` or unsafe duplicate literals.
- `topicType` serializes as `topicType`; `seniorityLevel: null` remains distinguishable from an omitted update field.
- `npm run typegen` is reproducible and generated artifacts match the backend source.

## Risk Assessment

- Generated OpenAPI may include unrelated backend changes; review and keep only the expected contract update.
- Existing service adapters have legacy shape comments; update comments so future contributors do not treat the new response as a contract gap.

## Security Considerations

No new permission logic. The FE only exposes lecturer seniority controls on existing authorized management screens; backend authorization remains authoritative.

## Next Steps

After this phase, Project UI and Lecturer UI were implemented using the shared service types.
