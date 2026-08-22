# Phase 5 — Tests, verification, and FE handoff

## Overview

Verify contract correctness, preserve manual behavior, and document the new FE
flow so future changes do not regress Timeframe version pinning.

## Automated verification

1. Add pure contract tests following the existing `node:test` style in
   `lib/api/services/portalContractAdapters.test.ts` or a dedicated
   `roundTimeframeContract.test.ts`.
2. Cover:
   - timeframe response normalization;
   - `timeframeId` payload omits `days`;
   - manual payload omits `timeframeId`;
   - duration derives from `groupDurationMinutes`;
   - legacy Round detail without Timeframe remains valid;
   - error detail preserves Backend error codes.
3. If TypeScript test execution is not available in the current repository,
   introduce the smallest maintainable npm test command rather than adding a full
   test framework. Prefer the existing Node test style and document the runtime.
4. Run:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

## Browser QA matrix

Run with Backend Timeframe data and at least one manual/legacy Round:

- create Round with quick Timeframe;
- create Round with manual Timeframe;
- create legacy manual Round;
- empty Timeframe list;
- Timeframe list/network failure;
- switch manual → Timeframe with unsaved slots;
- change Timeframe on DRAFT Round;
- attempt change on OPEN_REGISTRATION Round;
- regeneration blocked after availability/group preference;
- refresh detail and verify pinned revision/timeslots;
- edit global Timeframe and verify existing Round stays unchanged;
- create a new Round and verify it uses the new ACTIVE revision;
- keyboard-only source selection and form submission;
- 360px, tablet and desktop layouts;
- reduced-motion preference.

## Documentation

Create/update:

- `docs/api/timeframe-round-fe-integration.md`

Document:

- endpoint requests/responses;
- mutually exclusive `timeframeId`/`days` rule;
- revision pinning semantics;
- edit lifecycle restrictions;
- UI source modes and error states;
- verification commands and manual QA checklist.

## Rollback strategy

- Feature is isolated to the new branch.
- Keep manual mode as a fallback while rollout is verified.
- If Timeframe integration has a regression, hide the Timeframe source option via
  a small feature flag/guard and keep the existing manual path available.
- Do not modify global Timeframe CRUD behavior as part of rollback.

## Definition of done

- Automated checks pass.
- Browser QA matrix is recorded.
- No request sends both timeline sources.
- Existing manual Round creation and Round detail remain functional.
- FE handoff documentation matches the deployed Backend contract.

## Status and evidence

Completed for the repository checks:

- `npm run test:contract` — 4/4 passed.
- `npm run lint` — exit 0; existing `.agents/.claude` tooling emits warnings,
  with no lint errors in the feature files.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed; all Next.js routes compiled.
- Browser smoke check reached `/manager/rounds/new` and confirmed the auth guard
  redirects to `/login`. Authenticated API/browser matrix remains a follow-up
  requiring a live Backend session and fixture data; the detailed matrix is in
  `docs/api/timeframe-round-fe-integration.md`.
