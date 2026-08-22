# Phase 3 — Edit Round and Round detail integration

## Overview

Expose the pinned Timeframe identity in Round detail and allow safe Timeframe
changes while the Round is still editable under Backend lifecycle rules.

## Related files

Modify:

- `app/(round-wizard)/manager/rounds/[roundId]/edit/components/edit-round-config-page.tsx`
- `app/(round-detail)/manager/rounds/[roundId]/components/round-info-sidebar.tsx`
- `app/(round-detail)/manager/rounds/[roundId]/components/round-detail-header.tsx`
- `app/(round-detail)/manager/rounds/[roundId]/components/round-detail-page.tsx`

Create only if reuse is not clean:

- `app/(round-detail)/manager/rounds/[roundId]/components/round-timeframe-summary.tsx`

Reuse:

- `useRoundDetail`, `useUpdateRound`, `useTimeframes`
- existing `Input`, `Label`, `Select`, `Button`, `Skeleton`, `ErrorBlock`
- existing status labels and date/time formatting helpers

## Edit behavior

1. Read `round.timeframeId` and `round.timeframeVersionId`.
2. If the Round is `DRAFT`, show an enabled Timeframe selector.
3. If the Round is `OPEN_REGISTRATION`, display the pinned Timeframe but disable
   changing it because Backend regeneration is DRAFT-only.
4. If the Round is scheduling/published/locked, keep the configuration route
   inaccessible as current page behavior does.
5. Changing Timeframe requires a confirmation message explaining that generated
   timeslots will be replaced.
6. Submit `timeframeId`, dates and duration consistently; do not send manual days
   while the Round is Timeframe-backed.
7. After success, invalidate and refetch the Round detail so generated days/slots
   and version metadata are current.

## Detail behavior

Show a compact source summary near existing Round metadata:

```text
Nguồn lịch: Timeframe
Timeframe: Hội đồng cả ngày
Revision: v2 · ACTIVE tại thời điểm tạo Round
Ngày áp dụng: 01/09/2026 – 03/09/2026
Timeslot đã sinh: 9
```

For legacy manual Rounds, show:

```text
Nguồn lịch: Nhập thủ công
```

Existing calendar, availability heatmap, groups panel and draft schedule grid
continue consuming `round.days`; no client-side slot regeneration is added.

## Error and lifecycle UX

- `ROUND_TIMEFRAME_REGENERATION_BLOCKED`: retain form, explain existing
  availability/group preferences prevent replacement.
- `ROUND_TIMEFRAME_LOCKED`: show read-only source and refresh detail.
- `ROUND_TIMEFRAME_UNBIND_NOT_ALLOWED`: do not offer an empty/unbind option for a
  generated Round.
- `TIMEFRAME_NOT_FOUND`: invalidate Timeframe list and ask Manager to choose a
  current configuration.

## Success criteria

- Detail clearly distinguishes global Timeframe identity from pinned revision.
- Existing Round slots remain visible after refresh.
- Editing a DRAFT Round follows Backend constraints and never silently deletes
  availability or group preferences.
- Manual legacy Rounds remain editable through their existing controls.

## Status

Completed. Edit shows the pinned source, uses a confirmation Dialog for DRAFT
Timeframe changes, locks the selector for OPEN_REGISTRATION, prevents unbind,
and Round detail now shows Timeframe name, pinned revision ID and materialized
timeslot count.
