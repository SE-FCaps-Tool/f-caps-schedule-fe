---
title: "Integrate Timeframe into Round management"
description: "Connect the existing global Timeframe configuration to Round creation, editing, detail, validation, responsive UX, and automated verification."
status: completed
priority: P1
effort: 24h
branch: feature/round-timeframe-integration
tags: [feature, frontend, api, critical]
blockedBy: []
blocks: []
created: 2026-08-22
---

# Integrate Timeframe into Round management

## Overview

Tích hợp Timeframe global đã có vào toàn bộ luồng quản lý Round của FE, đúng
contract Backend hiện tại. Manager có thể chọn Timeframe khi tạo Round; Backend
ghim revision ACTIVE và materialize `round_days`/`timeslots`. FE vẫn giữ chế độ
nhập lịch thủ công để tương thích dữ liệu và flow cũ.

Phạm vi gồm API types/service, React Query hooks, Create Round wizard, Edit Round,
Round detail, timeline preview, responsive/accessibility, validation, tests và
handoff documentation.

## Current state

- CRUD Timeframe đã có tại `lib/api/services/fetchTimeframes.ts`,
  `hooks/useTimeframes.ts` và `components/master-data/timeframes-page.tsx`.
- `CreateRoundWizard` hiện chỉ tạo `days[].slots[]` thủ công.
- `RoundScheduleCalendar` gắn chặt với manual slot editing; sẽ được giữ nguyên
  cho manual mode.
- `fetchRounds.ts` chưa có `timeframeId`/`timeframeVersionId`.
- Các màn Round detail/calendar đã đọc `round.days`, nên downstream có thể dùng
  timeslot do Backend materialize mà không cần tự sinh lại.

## Backend contract to follow

- `POST /api/v1/semesters/{semesterId}/rounds` nhận `timeframeId`, `startDate`,
  `endDate` hoặc nhận `days[]`; không gửi đồng thời hai nguồn.
- Khi có `timeframeId`, `durationMinutes` phải bằng `groupDurationMinutes` của
  Timeframe.
- Backend lưu `timeframeId` và `timeframeVersionId`, sau đó sinh timeslot từ
  `groupSlots` cho từng ngày.
- Global Timeframe update tạo revision mới; Round đã tạo tiếp tục dùng revision
  đã ghim.
- Đổi Timeframe/regenerate slot chỉ hợp lệ khi Round còn `DRAFT`; Backend chặn
  nếu đã có availability hoặc group preference.
- `maxGroupsPerTimeslot` vẫn là cấu hình Round riêng, không tự suy ra từ
  `groupsPerSlot` nếu Backend chưa thay đổi contract.

## Cross-plan dependencies

Không phát hiện plan FE chưa hoàn tất trong repository. Backend dependency đã có
trên branch/main tại commit `5c94ce9` và được coi là contract nền.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Round-Timeframe API contract and hooks](./phase-01-api-contract-hooks.md) | Completed |
| 2 | [Create Round wizard and timeline preview](./phase-02-create-round-timeframe.md) | Completed |
| 3 | [Edit Round and Round detail integration](./phase-03-edit-detail-integration.md) | Completed |
| 4 | [Responsive UX, validation, and accessibility](./phase-04-ux-validation.md) | Completed |
| 5 | [Tests, verification, and FE handoff](./phase-05-tests-verification-handoff.md) | Completed |

## Definition of done

- Manager can select an active, non-archived Timeframe while creating a Round.
- Timeframe mode sends only `timeframeId` + Round date range; manual mode sends
  only `days[].slots[]`.
- Timeline preview shows blocks, group slots, breaks, duration, capacity, and
  revision information without duplicating Backend calculations.
- Edit Round displays the pinned Timeframe and enforces Backend lifecycle rules.
- Round detail shows Timeframe/version metadata and materialized timeslot count.
- Existing manual Round creation remains functional.
- Loading, empty, error, disabled, conflict, mobile, keyboard and reduced-motion
  states are covered.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, contract tests, and the
  documented browser QA matrix pass.
