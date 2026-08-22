# Phase 2 — Create Round wizard and timeline preview

## Overview

Tích hợp Timeframe vào `CreateRoundWizard` bằng progressive disclosure. Không
thay thế manual calendar; thêm lựa chọn nguồn lịch và một preview timeline dành
cho Timeframe mode.

## Related files

Modify:

- `app/(round-wizard)/manager/rounds/new/components/create-round-wizard.tsx`
- `hooks/manager/useRounds.ts` only where mutation typing/feedback requires it

Create:

- `app/(round-wizard)/manager/rounds/new/components/round-timeframe-preview.tsx`
- `app/(round-wizard)/manager/rounds/new/components/round-timeframe-fields.tsx`
  only if extracting date/deadline fields makes the wizard clearer and testable.

Reuse:

- `useTimeframes`
- `useCreateRound`
- `Select`, `Input`, `Label`, `Button`, `Skeleton`, `AlertTriangle`
- existing `StepHeader` and `cn`
- `RoundScheduleCalendar` only for manual mode

## UX design

Add a source selector in Step 1:

```text
Nguồn tạo lịch
[ Dùng Timeframe cấu hình sẵn ] [ Nhập lịch thủ công ]
```

Timeframe mode:

- Load active/non-archived Timeframes through `useTimeframes(false)`.
- Show a full-width Select with name/type/version summary.
- Show `groupDurationMinutes`, blocks/day, capacity/day and revision status.
- Lock `durationMinutes` to the selected Timeframe group duration.
- Show an empty state with a link to `/manager/timeframes` when no Timeframe
  exists; do not leave a blank Select.

Manual mode:

- Preserve current duration input and `RoundScheduleCalendar` behavior.
- Preserve current range, deadline, add-slot, remove-slot and overlap logic.

Step 2 Timeframe mode:

- Use simple responsive date inputs and deadline input.
- Render `RoundTimeframePreview` instead of the manual slot editor.
- Show each block, group slots, breaks, group duration, capacity and selected
  revision. Preview is display-only; FE never materializes Round timeslots.

Switching modes:

- Preserve date/deadline where possible.
- If manual slots already exist and the user switches to Timeframe, ask for
  confirmation before discarding the unsaved manual slots.
- If Timeframe is cleared, return to manual mode without losing other Round
  fields.

## Payload rules

Timeframe mode:

```ts
{
  ...roundConfig,
  timeframeId: selectedId,
  startDate,
  endDate,
  durationMinutes: selected.groupDurationMinutes,
  // no days
}
```

Manual mode keeps the current `days` payload and omits `timeframeId`.

## Validation and states

- Timeframe loading: Skeleton for the selector/summary.
- Timeframe list error: inline retry plus link to configuration.
- No selection: block Step 1 continuation in Timeframe mode.
- Missing date range/deadline: inline field errors.
- Duration mismatch: impossible through the locked control; retain server error
  handling for race/stale data.
- Create pending: disable submit and preserve form state.
- Server 409/422: show code-specific message at the relevant section.

## Responsive/accessibility requirements

- Desktop keeps the current three-column wizard rhythm.
- Tablet collapses to two columns; mobile becomes one column.
- Timeframe preview timeline rows stack vertically and avoid horizontal overflow.
- Source selector is keyboard reachable and exposes selected state via
  `aria-pressed`/radiogroup semantics.
- All fields have visible labels and error descriptions.
- Respect `prefers-reduced-motion` using the existing `useReducedMotion` pattern.

## Success criteria

- A Manager can create a Round with a Timeframe without seeing manual slot inputs.
- The request contains exactly one timeline source.
- A Manager can still create a manual Round exactly as before.
- Preview is readable on 360px-wide screens and desktop.

## Status

Completed. The wizard now supports Timeframe/manual source selection, loads the
selected Timeframe detail, previews generated blocks/group slots, preserves the
manual editor, guards source switching with confirmation, and sends exactly one
schedule source.
