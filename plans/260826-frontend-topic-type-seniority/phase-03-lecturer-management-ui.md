---
phase: 3
title: "Lecturer management UI"
status: completed
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 3: Lecturer Management UI

## Context Links

- Lecturer page: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/lecturers-page.tsx`
- Lecturer table: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/lecturers-table.tsx`
- Create dialog: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/add-lecturer-dialog.tsx`
- Account dialog: `W:/f-caps-schedule/f-caps-schedule-fe/app/(admin)/admin/accounts/components/create-account-dialog.tsx`
- Role assignment: `W:/f-caps-schedule/f-caps-schedule-fe/app/(admin)/admin/accounts/components/role-assignment-dialog.tsx`
- Query hooks: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/useLecturers.ts`, `hooks/admin/useAccounts.ts`

## Overview

Expose lecturer seniority across all existing management entry points, including explicit reset to `Chưa xét` and the newly supported lecturer PATCH operation.

## Requirements

- Display `Senior`, `MidLevel`, `Junior`, `Rookie`, and `null` with agreed Vietnamese labels/descriptions.
- Add seniority to direct lecturer creation and generic account creation when role is `LECTURER`.
- Add seniority to account role assignment when assigning `LECTURER`.
- Add an edit action in the lecturer table with a controlled select; choosing `Chưa xét` sends `seniorityLevel: null`.
- Preserve current account activation/deactivation flow and pagination.

## Architecture

The service owns the `PATCH /lecturers/{lecturerId}` call. `useUpdateLecturer` invalidates lecturer/admin account/audit queries after success. The table opens a small dedicated dialog rather than embedding editable controls in every row. The dialog uses shared seniority options and treats null as a first-class value, not an empty-string sentinel.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchLecturers.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/services/fetchAccounts.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/useLecturers.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/hooks/admin/useAccounts.ts`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/lecturers-table.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/add-lecturer-dialog.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(admin)/admin/accounts/components/create-account-dialog.tsx`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/app/(admin)/admin/accounts/components/role-assignment-dialog.tsx`
- Create: `W:/f-caps-schedule/f-caps-schedule-fe/components/lecturers/edit-lecturer-seniority-dialog.tsx`

## Implementation Steps

1. Extend create/update/account-role payloads with nullable seniority and add the mutation hook with existing toast/query invalidation conventions.
2. Add the seniority selector to `AddLecturerDialog`; reset it to null when the dialog closes successfully.
3. Add the selector conditionally to generic account creation and role assignment only for `LECTURER`.
4. Add the Seniority column and edit action to `LecturersTable`, preserving the existing account status switch and conflict tooltip.
5. Implement the edit dialog with current value initialization, descriptions, save pending state, error handling, and explicit null reset.
6. Add tests for create payloads, account-role payloads, PATCH null clearing, and table label fallback.

## Todo List

- [x] Add seniority to direct lecturer creation.
- [x] Add seniority to account creation and role assignment.
- [x] Add table label and edit action.
- [x] Implement explicit null reset behavior.
- [x] Preserve activation/deactivation behavior.
- [x] Verify through typecheck, lint, unit tests, and production build.

## Success Criteria

- Admin/manager can see every lecturer's seniority, including `Chưa xét`.
- Admin can set or clear seniority from the lecturer table.
- All lecturer creation paths produce the same payload semantics.
- Existing status toggle, conflict display, pagination, and query invalidation continue working.

## Risk Assessment

- `undefined` and `null` have different PATCH semantics; use `model` state plus explicit payload construction and test both.
- Generic account dialogs are role-dependent; switching roles must clear or ignore lecturer-only state so it is not sent for students/managers.
- Existing manager lookup work may touch a different lecturer hook; review git diff before implementation to avoid overwriting unrelated changes.

## Security Considerations

Seniority is management metadata. Do not expose edit controls to lecturer/student routes. Backend authorization and audit logging remain the source of truth.

## Next Steps

Lecturer import UI and supervised-project display are complete in Phase 4.
