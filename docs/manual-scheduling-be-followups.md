# Manual Scheduling - BE Follow-ups

> Tài liệu gửi BE sau khi FE đã nối service và React Query hooks theo handoff manual scheduling.

## 1. Response contract

`GET /api/v1/rounds/:roundId/manual-schedule` phải trả trong `data`:

- `roundStatus`
- `reviewerCount`
- `maxGroupsPerTimeslot` dạng `number | null`
- `revision`
- `roles`
- `config`
- `summary`
- `sessions`

Mỗi session phải có:

```json
{
  "id": "manual_session_123",
  "date": "2026-09-04",
  "roundTimeslotId": "1899",
  "startTime": "07:00",
  "endTime": "07:45",
  "status": "DRAFT",
  "groups": [],
  "room": null,
  "reviewers": [],
  "blockers": [],
  "warnings": []
}
```

## 2. Mutation response

### Create / update

`POST` và `PATCH` phải trả:

```json
{
  "data": {
    "revision": 1,
    "session": {}
  }
}
```

`roleLabel` và `order` được BE derive theo role schema. FE không gửi hoặc không được
tin `roleLabel`.

### Delete

Request nhận `clientRevision`:

```http
DELETE /api/v1/rounds/:roundId/manual-schedule/sessions/:sessionId?clientRevision=1
```

Response:

```json
{
  "data": {
    "id": "manual_session_123",
    "deleted": true,
    "revision": 2
  }
}
```

### Bulk upsert

`POST /sessions/bulk-upsert` nhận `clientRevision`, `allowDraftIncomplete`,
`deletedSessionIds` và `sessions`; response phải là full board mới nhất, gồm `revision`.

## 3. Options API

Endpoint:

```http
GET /api/v1/rounds/:roundId/manual-schedule/options
```

Hỗ trợ các query:

```text
date
roundTimeslotId
sessionId
role
reviewerIds[]
groupIds[]
roomId
search
page
pageSize
```

Mỗi option trong `lecturers`, `groups`, `rooms` phải có:

```json
{
  "available": true,
  "blockedCodes": [],
  "blockedReason": null
}
```

Lecturer cần thêm `eligibleRoles`. Options phải tính theo context hiện tại, gồm
timeslot, session đang edit, reviewer/group/room đã chọn, availability, invitation,
GVHD conflict, COI, double-booking và rule round.

Nếu có pagination, response giữ:

```json
{
  "data": {
    "lecturers": [],
    "groups": [],
    "rooms": []
  },
  "meta": {
    "page": 1,
    "pageSize": 200
  }
}
```

## 4. Validate / publish

Validate nhận revision của draft đang lưu:

```json
{
  "clientRevision": 3
}
```

Không yêu cầu FE gửi toàn bộ sessions trong request validate.

Publish nhận:

```json
{
  "clientRevision": 3,
  "confirmWarnings": [],
  "reason": "Manager published manual schedule"
}
```

Publish phải validate lại trong cùng transaction và trả `422 PUBLISH_BLOCKED` nếu còn
blocker.

## 5. Revision / stale state

- Tăng `revision` sau create, update, delete và bulk-upsert.
- Validate trả revision mới nhất.
- Sai revision trả HTTP `409`.
- Error code là `STALE_MANUAL_SCHEDULE_REVISION`.
- Error details cần có `currentRevision`.

Ví dụ:

```json
{
  "detail": {
    "code": "STALE_MANUAL_SCHEDULE_REVISION",
    "message": "Manual schedule draft was changed by another request.",
    "currentRevision": 4
  }
}
```

## 6. Constraint status cần xác nhận

Handoff hiện ghi các điểm sau chưa enforce:

- H14 role skill cho `CHAIR`/`SECRETARY`.
- H15 supervisor ratio.
- H11 previous reviewer của round trước.

Nếu chưa có source/config để enforce, BE cần trả trạng thái `notConfigured` hoặc ghi rõ
warning. Không trả như thể constraint đã pass.

`maxGroupsPerTimeslot = null` chỉ tắt H13; không được tắt các constraint khác và không
được fallback về `1`.

## 7. Official schedule sau publish

Nếu bảng official chỉ lưu enum `REVIEWER` mà không lưu `CHAIR`/`SECRETARY`, cần có API
hoặc mapping riêng để FE đọc đúng role sau publish. FE không tự suy ra role từ order.

## 8. Auth / environment

- Cookie session phải được chấp nhận với `credentials: include`.
- Mutation phải chấp nhận header `X-CSRF-Token` từ cookie `scheduler_csrf`.
- FE local mặc định dùng `NEXT_PUBLIC_API_URL`, hiện fallback là `http://localhost:8080/`.
- Nếu BE chạy ở port khác, cần set `NEXT_PUBLIC_API_URL` tương ứng.
