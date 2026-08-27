---
phase: 1
title: "Lecturer semester API and contract"
status: completed
priority: P1
effort: 5h
dependencies: []
---

# Phase 1: Lecturer Semester API and Contract

## Overview

Expose a Lecturer-scoped semester catalog and add semester-aware fields/filtering to the portal API without changing database schema or Manager permissions.

## Requirements

- Functional: return only semesters connected to the authenticated Lecturer.
- Functional: support `semesterId` filtering on Lecturer invitations, sessions, supervised projects, and remediations.
- Contract: return stable `semesterId`/`semesterCode` fields where FE needs display context.
- Security: never allow a Lecturer to enumerate unrelated semesters or another Lecturer's data.

## Architecture

Use existing joins through `rounds.semester_id`, `projects.semester_id`, and `schedule_versions.round_id`. Build the semester catalog with a distinct union/existence query. Keep response models explicit and camelCase-compatible through the existing `TargetResponseModel`/`ApiDataEnvelope` conventions.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/app/routes/target_portals.py`
- Modify: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/app/response_models.py`
- Modify: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/tests/test_lecturer_supervised_projects_contract.py`
- Add/modify: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/tests/test_lecturer_portal_semester_contract.py`

## Implementation Steps

1. Define a minimal `TargetLecturerSemesterResponse` containing id, code, name, status, start/end dates.
2. Implement `GET /api/v1/lecturer/me/semesters` with Lecturer scope validation and distinct semester relations.
3. Add optional `semesterId` query parsing to the four Lecturer list endpoints.
4. Add SQL predicates through the owning round/project semester relationship; keep ordering deterministic.
5. Include semester metadata in invitation/session rows and preserve existing response fields.
6. Add contract tests for accessible filtering, empty results, and OpenAPI schemas.
7. Export `apps/api/openapi.json` from the backend source of truth.

## Success Criteria

- [x] Lecturer can retrieve only related semesters.
- [x] Every portal list endpoint returns only rows for the requested semester.
- [x] Existing unfiltered behavior is either removed from FE usage or explicitly guarded; no accidental cross-semester mix.
- [x] Backend tests and lint pass.

## Risk Assessment

The same Lecturer can be both supervisor and reviewer in different semesters; use `UNION`/`EXISTS` rather than one inner-join path so the catalog is complete. Avoid exposing management-only actor/count fields.
