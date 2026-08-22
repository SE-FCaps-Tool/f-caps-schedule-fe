# FE Handoff — Tích hợp Timeframe vào Round

Tài liệu này mô tả phần tích hợp mới giữa Timeframe dùng chung và luồng tạo,
chỉnh sửa, xem chi tiết Round ở FE. CRUD Timeframe vẫn nằm tại màn hình Cấu
hình dùng chung; Round chỉ chọn một Timeframe và Backend sinh timeslot cho
phạm vi ngày của Round.

## 1. Nguyên tắc chính

Round có hai nguồn tạo lịch, và hai nguồn này loại trừ nhau:

```text
Dùng Timeframe
  → gửi timeframeId + startDate/endDate
  → Backend lấy revision ACTIVE của Timeframe
  → Backend ghim timeframeId + timeframeVersionId vào Round
  → Backend sinh round_days/timeslots cho từng ngày

Nhập thủ công
  → gửi days[].slots[] như flow cũ
  → không gửi timeframeId
```

FE không tự sinh hoặc tự sửa timeslot khi Round dùng Timeframe. Sau khi Round
được tạo, `round.days[].slots[]` là dữ liệu đã materialize từ Backend và được
dùng chung bởi calendar, availability heatmap, group preference và scheduler.

`maxGroupsPerTimeslot` vẫn là cấu hình riêng của Round. Không lấy
`groupsPerSlot`/capacity của Timeframe để tự ghi đè giá trị này.

## 2. Authentication

Base URL local:

```text
http://localhost:8000/api/v1
```

FE dùng cookie session:

```ts
credentials: "include";
```

API client hiện tại đã tự gắn `X-CSRF-Token` từ cookie `scheduler_csrf` cho
`POST`, `PATCH`, `PUT`, `DELETE`. Không thêm Bearer token và không tự gửi
`lecturerId`/`managerId` vào request.

## 3. API Round liên quan

### 3.1 Lấy danh sách Timeframe để chọn

```http
GET /api/v1/timeframes
```

FE dùng danh sách chưa archive. Detail Timeframe được tải thêm khi Manager
chọn một item để hiển thị blocks, group slots, capacity và revision.

Response danh sách:

```json
{
  "data": [
    {
      "id": 12,
      "name": "Hội đồng cả ngày",
      "type": "COUNCIL",
      "archivedAt": null,
      "version": {
        "id": 21,
        "number": 2,
        "status": "ACTIVE"
      },
      "groupDurationMinutes": 45,
      "blocksPerDay": 3,
      "capacityPerDay": 9
    }
  ],
  "meta": { "page": 1, "pageSize": 1, "total": 1 }
}
```

Nếu danh sách rỗng, FE phải cho Manager chuyển sang `Nhập thủ công` hoặc đi tới
màn hình tạo Timeframe trước.

### 3.2 Lấy detail Timeframe để preview

```http
GET /api/v1/timeframes/{timeframeId}
```

FE quan tâm các field:

```json
{
  "data": {
    "id": 12,
    "name": "Hội đồng cả ngày",
    "type": "COUNCIL",
    "version": {
      "id": 21,
      "number": 2,
      "status": "ACTIVE"
    },
    "groupDurationMinutes": 45,
    "blocksPerDay": 3,
    "groupsPerBlock": 3,
    "capacityPerDay": 9,
    "breakWindows": [
      { "name": "Nghỉ trưa", "startTime": "11:45:00", "endTime": "13:00:00" }
    ],
    "blocks": [
      {
        "sequenceNumber": 1,
        "startTime": "07:00:00",
        "endTime": "09:15:00",
        "groupSlots": [
          { "sequenceNumber": 1, "startTime": "07:00:00", "endTime": "07:45:00" },
          { "sequenceNumber": 2, "startTime": "07:45:00", "endTime": "08:30:00" },
          { "sequenceNumber": 3, "startTime": "08:30:00", "endTime": "09:15:00" }
        ]
      }
    ]
  }
}
```

`blocks` là preview giao diện. Khi tạo Round, FE không gửi lại `blocks`; Backend
tự dùng revision đang active để materialize timeslot.

### 3.3 Tạo Round bằng Timeframe

```http
POST /api/v1/semesters/{semesterId}/rounds
Content-Type: application/json
```

Request:

```json
{
  "name": "Review tháng 9",
  "type": "REVIEW_1",
  "description": "Đợt review giữa kỳ",
  "startDate": "2030-09-01",
  "endDate": "2030-09-03",
  "durationMinutes": 45,
  "reviewerCount": 2,
  "maxGroupsPerTimeslot": 3,
  "registrationDeadline": "2030-09-01T09:00:00+07:00",
  "groupSelectionMode": true,
  "groupPreferenceDeadline": null,
  "resultOwnerMode": false,
  "roomTypes": ["NORMAL"],
  "timeframeId": 12
}
```

Quy tắc:

- Có `timeframeId` thì bắt buộc có `startDate` và `endDate`.
- `durationMinutes` phải bằng `groupDurationMinutes` của Timeframe.
- Không gửi `days` cùng lúc với `timeframeId`.
- `reviewerCount` phải đúng loại Round: Review 1/2 = 2, Defense 1.1 = 3,
  Defense 1.2/2 = 5.
- Deadline phải có timezone offset và nằm trong khoảng ngày Round.

Response thành công `201`:

```json
{
  "data": {
    "id": "42",
    "name": "Review tháng 9",
    "status": "DRAFT"
  }
}
```

Sau response thành công, FE chuyển tới detail Round rồi gọi GET detail để lấy
`timeframeVersionId` và các `days[].slots[]` đã sinh.

### 3.4 Tạo Round thủ công — tương thích flow cũ

```http
POST /api/v1/semesters/{semesterId}/rounds
```

Request chỉ dùng `days`, không có `timeframeId`:

```json
{
  "name": "Review thủ công",
  "type": "REVIEW_1",
  "startDate": "2030-09-01",
  "endDate": "2030-09-01",
  "durationMinutes": 45,
  "reviewerCount": 2,
  "maxGroupsPerTimeslot": 3,
  "registrationDeadline": "2030-09-01T09:00:00+07:00",
  "groupSelectionMode": true,
  "resultOwnerMode": false,
  "roomTypes": ["NORMAL"],
  "days": [
    {
      "date": "2030-09-01",
      "slots": [
        { "startTime": "07:00", "endTime": "07:45" },
        { "startTime": "07:45", "endTime": "08:30" }
      ]
    }
  ]
}
```

Không gửi cả hai nguồn. Đây là kiểm tra quan trọng nhất ở network request:

```text
Timeframe mode: timeframeId có, days không có
Manual mode: days có, timeframeId không có
```

### 3.5 Lấy detail Round

```http
GET /api/v1/rounds/{roundId}
```

Wire response có thể dùng snake_case; service FE normalize về `RoundDetail`:

```ts
type RoundDetail = {
  id: string;
  name: string;
  type: RoundType;
  status: RoundStatus;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  timeframeId: string | null;
  timeframeVersionId: string | null;
  days: Array<{
    date: string;
    slots: Array<{ id: string; startTime: string; endTime: string }>;
  }>;
};
```

Ví dụ dữ liệu sau normalize:

```json
{
  "id": "42",
  "name": "Review tháng 9",
  "status": "DRAFT",
  "durationMinutes": 45,
  "timeframeId": "12",
  "timeframeVersionId": "21",
  "days": [
    {
      "date": "2030-09-01",
      "slots": [
        { "id": "501", "startTime": "07:00", "endTime": "07:45" },
        { "id": "502", "startTime": "07:45", "endTime": "08:30" }
      ]
    }
  ]
}
```

Nếu `timeframeId` và `timeframeVersionId` đều `null`, đó là Round thủ công hoặc
legacy Round. Các component lịch hiện tại vẫn dùng `round.days` như cũ.

### 3.6 Cập nhật Round

```http
PATCH /api/v1/rounds/{roundId}
Content-Type: application/json
```

Adapter FE hiện gửi body snake_case:

```json
{
  "start_date": "2030-09-01",
  "end_date": "2030-09-03",
  "session_duration_minutes": 45,
  "max_groups_per_timeslot": 3,
  "registration_deadline": "2030-09-01T09:00:00+07:00",
  "group_selection_mode": true,
  "result_owner_mode": false,
  "room_types": ["NORMAL"],
  "timeframe_id": 12
}
```

`PATCH` là update cấu hình Round hiện tại. Sau thành công, hook invalidate
`["manager", "round", roundId]` và detail được fetch lại; FE không tin body
PATCH là dữ liệu hiển thị cuối cùng.

Không có thao tác unbind Timeframe. Nếu Round đã được tạo từ Timeframe, FE không
hiển thị lựa chọn rỗng để tránh gửi `timeframe_id: null`.

## 4. Revision pinning và tác động tới Round

Khi tạo Round:

```text
Timeframe 12 / revision 21 ACTIVE
→ Round.timeframeId = 12
→ Round.timeframeVersionId = 21
→ sinh round_days/timeslots từ revision 21
```

Nếu Manager sửa Timeframe global và tạo revision 22, Round cũ vẫn giữ revision
21. Không tự refresh timeslot của Round cũ. Round mới chọn Timeframe đó sẽ dùng
revision 22 ACTIVE.

Do đó FE phải:

- hiển thị revision đã ghim ở Round detail;
- không lấy revision ACTIVE hiện tại để thay thế metadata của Round cũ;
- dùng `round.days` để hiển thị lịch đã materialize;
- chỉ tải Timeframe detail để hiển thị tên/cấu hình tham chiếu, không dùng nó để
  overwrite `round.days`.

## 5. Lifecycle khi chỉnh Timeframe của Round

| Trạng thái Round | UI Timeframe | Backend |
|---|---|---|
| `DRAFT` | Cho đổi Timeframe | Có thể regenerate timeslot nếu chưa có availability/preference |
| `OPEN_REGISTRATION` | Hiển thị read-only | Từ chối regenerate vì chỉ cho phép ở DRAFT |
| `REGISTRATION_CLOSED` trở đi | Trang config bị khóa theo flow hiện tại | Không cho sửa cấu hình |

Khi đổi Timeframe hoặc đổi ngày của Round đang dùng Timeframe, Backend có thể
xóa và sinh lại toàn bộ `round_days`/`timeslots`. Vì vậy FE phải:

1. hiển thị Dialog xác nhận trước khi đổi Timeframe;
2. nói rõ lịch slot sẽ được thay thế;
3. chỉ cho thao tác khi Round ở `DRAFT`;
4. sau lưu, refetch detail;
5. giữ nguyên form nếu Backend trả lỗi conflict.

Các lỗi cần map:

| Code | UI message/behavior |
|---|---|
| `TIMEFRAME_NOT_FOUND` | Timeframe không tồn tại/không có revision dùng được; reload list và yêu cầu chọn lại |
| `TIMEFRAME_SESSION_DURATION_MISMATCH` | Thời lượng Round phải bằng phút/nhóm của Timeframe |
| `ROUND_TIMEFRAME_LOCKED` | Không thể regenerate slot sau khi Round rời DRAFT; giữ form và refresh detail |
| `ROUND_TIMEFRAME_REGENERATION_BLOCKED` | Đã có availability hoặc group preference; không thay thế lịch |
| `ROUND_TIMEFRAME_UNBIND_NOT_ALLOWED` | Không cung cấp lựa chọn bỏ Timeframe |
| `ROUND_CONFIG_LOCKED` | Round đã vào lifecycle không cho chỉnh cấu hình |
| `ROUND_DATE_INVALID` | Ngày kết thúc phải sau hoặc bằng ngày bắt đầu |

## 6. Luồng UI hoàn chỉnh

### 6.1 Tạo Round

```text
Mở Tạo Round
→ GET /timeframes
→ Chọn “Dùng Timeframe” hoặc “Nhập thủ công”
→ Dùng Timeframe: chọn item → GET /timeframes/{id}
→ Hiển thị timeline, group slots, revision, capacity, break
→ Nhập ngày bắt đầu/kết thúc và deadline
→ Kiểm tra durationMinutes = groupDurationMinutes
→ Submit payload đúng một nguồn
→ Backend tạo Round + materialize timeslots
→ Điều hướng Round detail
→ GET /rounds/{id} để hiển thị revision và days/slots
```

Chế độ thủ công giữ nguyên `RoundScheduleCalendar` hiện có. Chuyển mode không
trộn dữ liệu request: days cũ chỉ được gửi khi submit ở manual mode.

### 6.2 Detail Round

Sidebar cần hiển thị:

```text
Nguồn lịch: Timeframe
Timeframe: Hội đồng cả ngày
Revision đã ghim: 21
Timeslot đã sinh: 9
```

Round thủ công hiển thị:

```text
Nguồn lịch: Nhập thủ công
```

Calendar, heatmap, group panel và draft schedule grid không cần biết nguồn tạo
lịch; tất cả đọc `round.days`.

### 6.3 Edit Round

- `DRAFT`: Timeframe selector bật; đổi item mở Dialog xác nhận.
- `OPEN_REGISTRATION`: selector hiển thị Timeframe hiện tại nhưng disabled.
- Nếu là manual Round ở DRAFT, có thể chọn Timeframe để chuyển sang generated
  slots; Backend sẽ thay thế lịch manual khi lưu.
- Duration input disabled khi có Timeframe; FE tự lấy `groupDurationMinutes`.
- Không hiển thị action unbind Timeframe.

## 7. Loading, empty, error và responsive states

### Timeframe list

- Loading: skeleton ở Select/preview.
- Empty: nói rõ chưa có cấu hình và cho chuyển manual.
- Error: giữ form, hiển thị `Thử lại`, không submit Timeframe mode khi chưa có
  item hợp lệ.

### Preview

- Detail loading: skeleton timeline.
- Detail error: retry riêng cho Timeframe detail.
- Không preview: trạng thái “Chưa chọn Timeframe”.
- Blocks nhiều: timeline list scroll theo nội dung, không làm vỡ layout.

### Accessibility/responsive

- Hai nguồn lịch là radio buttons có `role="radiogroup"` và `aria-checked`.
- Select, date, deadline dùng label liên kết bằng `htmlFor`.
- Nút đổi Timeframe và retry dùng được bằng keyboard.
- Timeline preview xếp một cột ở mobile, chuyển grid ở màn hình rộng.
- Không phụ thuộc hover để đọc giờ hoặc số nhóm.
- Tôn trọng reduced motion của các component hiện tại.

## 8. Checklist kiểm tra network

- [ ] Tạo Timeframe mode không có key `days`.
- [ ] Tạo manual mode không có key `timeframeId`.
- [ ] `durationMinutes` đúng bằng `groupDurationMinutes`.
- [ ] Có `startDate`/`endDate` khi dùng Timeframe.
- [ ] Không gửi `blocks`, `capacityPerDay`, `timeframeVersionId` trong create
  Round; đây là dữ liệu Backend tính/lưu.
- [ ] GET Round detail sau create có `timeframeId`, `timeframeVersionId` và
  `days[].slots[]`.
- [ ] Global Timeframe revision mới không làm thay đổi Round cũ.
- [ ] Đổi Timeframe ở DRAFT refetch được days/slots mới.
- [ ] OPEN_REGISTRATION không cho đổi Timeframe.
- [ ] Manual Round cũ vẫn mở detail/calendar bình thường.

## 9. Verification commands

Chạy tại root FE:

```powershell
npm run test:contract
npm run lint
npx tsc --noEmit
npm run build
```

`test:contract` dùng Node 22 `--experimental-strip-types` và kiểm tra:

- payload Timeframe không lẫn `days`;
- payload manual không lẫn `timeframeId`;
- giữ duration của payload;
- normalize camelCase/snake_case Timeframe metadata;
- legacy Round không có Timeframe vẫn nhận `null`.

## 10. Browser QA matrix

- [ ] Tạo Round bằng Timeframe có preview blocks.
- [ ] Tạo Round manual như flow cũ.
- [ ] Timeframe list rỗng.
- [ ] Timeframe list lỗi và retry.
- [ ] Detail Timeframe lỗi và retry.
- [ ] DRAFT đổi Timeframe, xác nhận Dialog, lưu và thấy slots mới.
- [ ] OPEN_REGISTRATION thấy Timeframe read-only.
- [ ] Backend từ chối regenerate sau availability/preference; form không mất dữ liệu.
- [ ] Sửa Timeframe global tạo revision mới; Round cũ giữ revision cũ.
- [ ] Round detail hiển thị đúng nguồn, revision và số timeslot.
- [ ] Kiểm tra 360px, tablet, desktop và keyboard-only.
