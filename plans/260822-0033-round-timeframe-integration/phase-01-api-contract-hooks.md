# Phase 1 — Round-Timeframe API contract and hooks

## Overview

Mở rộng lớp API hiện có để FE hiểu đúng Round có nguồn lịch là Timeframe hoặc
manual days, đồng thời giữ cách unwrap/normalize response hiện tại.

## Related files

Modify:

- `lib/api/services/fetchRounds.ts`
- `hooks/manager/useRounds.ts`
- `hooks/useTimeframes.ts`
- `lib/api/errorDetail.ts` nếu các mã lỗi mới chưa có message thân thiện

Create only if needed:

- `lib/api/services/roundTimeframePayload.ts` cho pure payload builders dùng chung
  giữa create/edit và unit tests.

## Requirements

1. Add `timeframeId?: number` to `RoundCreatePayload`.
2. Add `timeframeId?: number` to `RoundUpdatePayload`.
3. Add nullable `timeframeId` and `timeframeVersionId` to `RoundDetail` and
   `RoundListItem` only if the list response supplies them.
4. Normalize both camelCase and legacy snake_case response fields.
5. Keep target create endpoint camelCase:
   `POST /api/v1/semesters/{semesterId}/rounds`.
6. Keep existing PATCH body conversion convention and add `timeframe_id` mapping
   consistently with the current Backend alias behavior.
7. Make payload construction mutually exclusive:
   - Timeframe mode: omit `days`.
   - Manual mode: omit `timeframeId`.
8. Add `useTimeframe(id)` only if list data is insufficient for the preview; use
   existing `fetchTimeframes.getById`, not a duplicate API client.
9. Reuse existing Query keys and invalidation behavior.

## Error handling

Map or preserve server details for:

- `TIMEFRAME_NOT_FOUND`
- `TIMEFRAME_SESSION_DURATION_MISMATCH`
- `ROUND_TIMEFRAME_LOCKED`
- `ROUND_TIMEFRAME_REGENERATION_BLOCKED`
- `ROUND_TIMEFRAME_UNBIND_NOT_ALLOWED`
- `ROUND_CONFIG_LOCKED`
- `VALIDATION_ERROR`

## Implementation steps

1. Add shared types for Timeframe source mode and Round timeframe metadata.
2. Add response normalization for `timeframeId`/`timeframeVersionId`.
3. Add create/update payload builders or equivalent explicit branches.
4. Extend `fetchRounds.create` and `fetchRounds.update`.
5. Add the detail query hook only if required by the list response shape.
6. Extend friendly error messages without hiding Backend `details.errors`.
7. Add pure tests for exclusive payloads and response normalization.

## Success criteria

- TypeScript accepts both Round sources.
- A Timeframe Round request cannot accidentally include `days`.
- A manual Round request cannot accidentally include `timeframeId`.
- Backend response metadata survives normalization.
- Existing Round API callers continue compiling.

## Status

Completed. Added Round Timeframe metadata normalization, mutually exclusive
payload construction, `useTimeframe(id)`, PATCH `timeframe_id` mapping, friendly
Backend error messages, and pure contract tests.

## Risks and mitigations

- **Mixed naming:** centralize conversion and test camelCase/snake_case inputs.
- **Falsy ID:** validate `timeframeId > 0`; do not use truthiness for selection.
- **Stale list:** invalidate Round detail/list after create/update as existing hooks
  already do.
