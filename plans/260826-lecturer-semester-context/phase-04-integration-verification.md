---
phase: 4
title: "Integration verification and generated contracts"
status: in-progress
priority: P1
effort: 4h
dependencies: [1, 2, 3]
---

# Phase 4: Integration Verification and Generated Contracts

## Overview

Verify the cross-repository contract, UI behavior, and release safety before merging the backend and frontend changes.

## Requirements

- Contract: FE generated OpenAPI must be regenerated from the updated BE OpenAPI.
- Regression: preserve Manager semester behavior and existing Lecturer actions.
- Quality: test empty, invalid, historical, and ACTIVE semester cases.

## Related Code Files

- Modify: `W:/f-caps-schedule/f-caps-schedule-be/apps/api/openapi.json`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/generated/openapi.json`
- Modify: `W:/f-caps-schedule/f-caps-schedule-fe/lib/api/generated/schema.d.ts`
- Add/modify: backend Lecturer portal tests and FE component/service tests

## Implementation Steps

1. [x] Run backend lint and targeted Lecturer portal/API contract tests.
2. [x] Run the backend non-integration suite.
3. [x] Run the existing OpenAPI export script from `apps/api`.
4. [x] Run FE `npm run typegen` and compare BE/FE OpenAPI SHA256 values.
5. [x] Run FE tests, typecheck/lint, and production build.
6. Perform a browser smoke test with two semesters and verify network requests include the selected `semesterId`.
7. Review staged files explicitly; keep unrelated worktree files out of commits.

## Success Criteria

- [x] Backend and frontend generated OpenAPI hashes match.
- [x] All automated checks pass.
- [ ] Browser confirms header selection, URL persistence, filter requests, and no cross-semester leakage.
- [ ] Manager smoke test remains green.

## Risk Assessment

The most likely release failure is generated-contract drift. Treat typegen and SHA comparison as a hard gate before commit/push.
