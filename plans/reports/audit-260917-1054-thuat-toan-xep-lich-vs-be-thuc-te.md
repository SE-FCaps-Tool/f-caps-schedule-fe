# Audit: Thuat-toan-xep-lich-Capstone.md vs BE thực tế + FE integration

Nguồn: `W:\f-caps-schedule\f-caps-schedule-be\docs\Thuat-toan-xep-lich-Capstone.md` (đối chiếu `apps/api/app/scheduler/*` trong BE repo + `lib/api/services/fetchScheduling.ts`, `docs/scheduling.md` trong FE repo).

## Kết luận ngắn

**Không khớp.** Tài liệu mô tả một thuật toán khác hẳn (kiến trúc, mô hình dữ liệu, ràng buộc) so với BE đang chạy. Quan trọng hơn: **file doc này chưa commit vào git BE** (`git status --porcelain` → `?? docs/Thuat-toan-xep-lich-Capstone.md`) — nhiều khả năng đây là spec đích cho một lần viết lại, chưa phải mô tả hệ thống hiện có.

FE hiện tại được xây đúng theo BE thật (CP-SAT, `solver_status: "OPTIMAL"`, `soft_scores: {S1: ...}` — xem `docs/scheduling.md` FE, `lib/api/services/fetchScheduling.ts`), nên FE **không** lệch pha với BE — cả hai cùng phản ánh hệ thống CP-SAT thật, khác với tài liệu thuật toán mới.

## Khác biệt kiến trúc cốt lõi

| Tài liệu mô tả | BE thực tế |
|---|---|
| Thuật toán 2 pha tự viết: Pha 1 local search theo ngày (R=12 restart × I=6000 swap), Pha 2 hoán vị nhóm↔ghế (N=120k-400k swap) | Một model **OR-Tools CP-SAT** duy nhất, phẳng (`scheduler.py::_build_model`/`solve_schedule`) — không có 2 pha, không restart/swap loop (grep 0 hit) |
| Council ngồi cố định cả ngày 1 phòng, chấm nhiều nhóm | Mỗi group/session tạo 1 row `councils` riêng (`schedule_operations.py:1286-1300`) — không có bất biến "1 council/ngày/phòng chấm nhiều nhóm" |
| CouncilSeat có roleIndex 0=Chủ tịch/1=Thư ký/2-4=Thành viên | Enum `assignment_role` chỉ có SUPERVISOR/REVIEWER/RESULT_OWNER/REMEDIATION_VERIFIER/PROJECT_LEADER — **không có CHAIR/SECRETARY**; chủ tịch/thư ký chỉ là quy ước vị trí `reviewer_ids[0]`/`[1]` trong code |
| Lecturer có `level` (senior/middle/junior) | Bảng `lecturers` không có cột level/rank nào — H8 (≥1 Middle mỗi hội đồng) **không thể** implement với schema hiện tại |
| Review 2 = chép Review 1, chỉ thay người bị chặn, có nhật ký thay đổi | Review 2 **giải lại từ đầu** bằng CP-SAT như mọi round khác; continuity chỉ là soft bonus mặc định weight=0 (`scheduler.py:552-554`) — đúng lỗi §11.2 của chính tài liệu cảnh báo |
| Trọng số mềm: noPreviousMember=20000, matchedByMemberNotChair=800, khớp Chủ tịch=0, ... | Không tồn tại key nào trong số này; cơ chế thật là `S1..S9` trừu tượng đọc từ `rounds.soft_weights jsonb`, mặc định **rỗng `{}`** (không có ưu tiên nào bật sẵn) |
| Trần lý thuyết (ceiling) theo Chủ tịch | Không tồn tại — grep 0 hit "ceiling/trần" |
| Feasibility pre-check trước khi chạy (đếm rảnh cả ngày, secretary pool, Middle coverage) | Không tồn tại — CP-SAT tự báo INFEASIBLE/timeout sau khi chạy (~28s+), không có check rẻ trước |
| H11: rảnh TOÀN NGÀY mới được xếp | BE chỉ check rảnh theo **từng timeslot** (`candidates.py:43-47`, `validator.py:109-119`) — đúng y lỗi §11.2 cảnh báo |
| H6/H7: secretary pool cứng + cặp cấm | Secretary pool chỉ là +100 soft bonus, không loại cứng; PairRule/cặp cấm **không tồn tại** ở đâu cả |
| H9: tối đa 1 nhóm/GVHD/hội đồng, phạt 60×(n-1)² | Không implement (grep 0 hit) |

## Điểm BE làm đúng tinh thần tài liệu

- Ràng buộc cứng thật sự bị loại bỏ (hard reject / 422), không bị trừ điểm — không rơi vào lỗi "phạt điểm ràng buộc cứng" mà §11.2 cảnh báo.
- Khớp giảng viên bằng `lecturer_id` (khóa số), không dùng tên tiếng Việt có dấu — đúng khuyến nghị §11.2, thậm chí chặt hơn.
- Ít nhất 1 luồng validate chạy trên dữ liệu đã persist lại từ DB (không chỉ in-memory) tại thời điểm activate — đúng tinh thần §9.
- Soft weight đọc từ `rounds.soft_weights jsonb`, chỉnh được không cần sửa code — đúng tinh thần thiết kế của SolverWeight, dù field/giá trị khác hẳn.

## Việc cần làm (đề xuất, chưa thực hiện)

1. Xác nhận với đội BE: `Thuat-toan-xep-lich-Capstone.md` là spec đích cho lần viết lại, hay tài liệu lỗi thời cần xoá/cập nhật? File đang chưa commit.
2. Nếu là spec đích: đây thực chất là bản gap-analysis cho một rewrite lớn (đổi thuật toán CP-SAT → local search 2 pha, đổi schema council/seat, thêm level giảng viên, thêm PairRule...) — không phải bug fix nhỏ.
3. Nếu giữ CP-SAT hiện tại: nên cập nhật tài liệu để phản ánh đúng kiến trúc thật, tránh đội dev sau đọc nhầm.
4. FE không cần đổi gì ngay — FE đã khớp đúng BE thật.

## Unresolved questions

- File doc mới có phải do ai đó trong team BE vừa viết hôm nay (17/09) làm spec cho việc viết lại không, hay là tài liệu tham khảo cũ được thêm vào sau? Cần hỏi trực tiếp người phụ trách BE.
