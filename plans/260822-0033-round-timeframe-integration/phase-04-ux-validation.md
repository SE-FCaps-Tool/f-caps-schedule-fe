# Phase 4 — Responsive UX, validation, and accessibility

## Overview

Polish all new states using the existing product register: white surface,
restrained orange action/selection color, familiar controls, dense but readable
Manager UI, and mobile-safe interaction.

## Design constraints

- Reuse current OKLCH tokens in `app/globals.css`; do not add a parallel palette.
- Reuse current radius/button/select vocabulary; no decorative gradients or glass
  surfaces.
- Use orange only for selected source, primary action, active timeline markers and
  important warnings.
- Keep explanatory text short and place constraints next to the field/action that
  can trigger them.
- Use existing motion conventions and `useReducedMotion`.

## State matrix

| State | Create wizard | Edit/detail |
|---|---|---|
| Loading | selector/preview skeleton | source summary skeleton |
| Empty | explain no active Timeframe + config link | explain legacy/manual source |
| Error | retry Timeframe list, preserve Round draft | inline Backend error + refetch |
| Disabled | locked duration/version/status | locked selector by Round status |
| Conflict | unsaved manual slots confirmation | regeneration blocked explanation |
| Success | summary + timeline preview | pinned revision + materialized slot count |

## Validation requirements

- Timeframe must be active and not archived.
- `startDate <= endDate`.
- Registration deadline must include timezone and fall within Round dates.
- `durationMinutes` must equal Timeframe `groupDurationMinutes`.
- `timeframeId` and `days` are mutually exclusive.
- Do not locally duplicate Backend capacity calculations; display API-provided
  preview/detail values.
- Preserve raw server validation details for debugging without exposing stack
  traces.

## Responsive requirements

- 360px: source selector stacks, Select uses full width, timeline rows wrap, no
  clipped summary metrics.
- 768px: two-column configuration sections collapse cleanly.
- Desktop: maintain current max-width and three-column wizard composition.
- Touch targets remain at least 40px; buttons retain visible focus rings.
- Long Timeframe names and revision labels truncate gracefully with accessible
  full text.

## Accessibility requirements

- Use a real radiogroup or equivalent keyboard semantics for source selection.
- Associate labels and errors with controls.
- Announce async loading/error state where appropriate.
- Do not rely on orange alone for selected/error state; add text/icon/border.
- Ensure contrast for muted text and warning copy.

## Success criteria

- No new UI introduces overflow, inaccessible controls, or ambiguous source state.
- Manual and Timeframe modes are visually distinct without creating a second design
  system.
- Error copy tells the Manager what action is possible next.

## Status

Completed. Existing design tokens/components are reused; loading, empty, retry,
disabled, conflict, keyboard and mobile-safe layouts are covered in the new
states. The source selector uses radiogroup semantics and all new controls have
labels/focus states.
