# 2026-08-22 — Round Timeframe integration

## Outcome

Integrated the existing global Timeframe configuration into the Manager Round
flow without removing manual slot creation.

## Changes

- Added Round `timeframeId`/`timeframeVersionId` response normalization and PATCH
  mapping.
- Added `useTimeframe(id)` and a tested payload builder that prevents sending
  `timeframeId` and `days` together.
- Added Timeframe/manual source selection, Timeframe detail preview, generated
  block/group-slot display, empty/error/retry states and source-switch confirmation
  to Create Round.
- Added pinned Timeframe display and DRAFT-only replacement confirmation to Edit
  Round; OPEN_REGISTRATION remains read-only for Timeframe changes.
- Added Timeframe name, pinned revision ID and materialized timeslot count to
  Round detail.
- Added FE handoff at `docs/api/timeframe-round-fe-integration.md`.

## Verification

- `npm run test:contract`: 4/4 passed.
- `npm run lint`: passed with pre-existing tooling warnings.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Browser smoke reached the protected Round creation route and verified the
  expected login redirect. Authenticated API/browser cases require live backend
  session and fixture data.

## Follow-up

Run the authenticated browser QA matrix from the handoff document against a
fixture containing at least one active Timeframe, one DRAFT Round and one
OPEN_REGISTRATION Round.
