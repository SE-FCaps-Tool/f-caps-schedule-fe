# Brainstorm: sửa endpoint import đề tài Excel để hỗ trợ Mã nhóm + GVHD

## Problem

User có file Excel thật: STT | Mã đề tài | Mã nhóm | Tên đề tài Tiếng Anh/Nhật | Tên đề tài Tiếng Việt | Department | GVHD | GVHD1 | GVHD2 | Submit | Conflict | Final Score | Final Result. Cần import vào hệ thống, bỏ Submit/Conflict/Final Score/Final Result (không cần cho hệ thống), gán GVHD vào tài khoản giảng viên có sẵn.

## Scout findings

- BE đã có **endpoint thật đang chạy**: `POST /api/v1/projects/import` (`apps/api/app/routes/manager_extensions.py:1237`), có FE dialog thật đã ship (`components/projects/import-projects-dialog.tsx`, `fetchProjects.importFile`, `useImportProjects`, nút "Import" trên `manager/projects`).
- Endpoint cũ đọc template: `code, semesterCode, majorCode, titleVi, titleEn, topicType` — không có Mã nhóm, không có GVHD, bắt buộc semesterCode/majorCode phải là cột trong sheet, trùng mã đề tài thì skip (không upsert).
- 2 script CLI rời rạc khác cũng tồn tại (`tools/import_projects_sheet.py` — match GVHD theo tên hiển thị; `tools/import_excel_database.py` — seed toàn bộ DB, TRUNCATE, match GVHD theo lecturer_code) — không dùng làm nền tảng, chỉ tham khảo helper (header detection).
- Schema thật: `projects`(semester_id, major_id, code, title_vi/en, topic_type) — `groups`(project_id UNIQUE 1-1, code) — `project_supervisors`(project_id, lecturer_id, type MAIN/CO, tối đa 2) — `majors` hiện chỉ có 1 dòng thật `SE`.
- Có staging schema dormant `excel_import_batches`/`excel_projects` (0 dòng, không route nào dùng) — quyết định KHÔNG dùng, over-engineer cho nhu cầu hiện tại.

## Quyết định cuối (đã duyệt)

**Sửa trực tiếp endpoint cũ**, không tạo endpoint song song:

| Hạng mục | Giá trị |
|---|---|
| Output | Sửa `POST /api/v1/projects/import` (nhận thêm query param `semesterId`) |
| Acceptance | Mỗi dòng: upsert `projects`(code, title_vi, title_en, major=SE cố định) theo mã đề tài trong semester → tạo `groups` rỗng theo mã nhóm → gán `project_supervisors` MAIN=GVHD/GVHD1, CO=GVHD2 (nếu có) theo lecturer_code. Dòng lỗi (GVHD không khớp, thiếu field) skip + ghi lỗi riêng, không fail cả batch |
| Scope | Bỏ hẳn: STT, Department, Submit, Conflict, Final Score, Final Result. Không tạo thành viên nhóm (group rỗng, thêm SV sau bằng flow có sẵn). Bỏ đọc semesterCode/majorCode từ sheet (khác hành vi cũ) |
| Constraints | Major cố định SE; tối đa 2 GVHD (GVHD=GVHD1=MAIN, GVHD2=CO); khớp GVHD bằng lecturer_code chuẩn hoá qua `normalize_code`; semester từ query param; trùng mã đề tài → upsert (khác hành vi cũ là skip) |
| Touchpoints BE | `apps/api/app/routes/manager_extensions.py` (sửa `import_projects`), `response_models.py` nếu cần field mới |
| Touchpoints FE | `components/projects/import-projects-dialog.tsx` (bảng hướng dẫn cột: bỏ semesterCode/majorCode/topicType, thêm groupCode/GVHD/GVHD1/GVHD2), `lib/api/services/fetchProjects.ts` (gửi kèm semesterId), `hooks/manager/useProjects.ts` + `app/(manager)/manager/projects/components/projects-page.tsx` (truyền semesterId từ SemesterProvider context có sẵn) |

**Giả định (chưa hỏi lại, có thể sai):** GVHD1 (=GVHD) luôn bắt buộc mỗi đề tài — khớp ràng buộc `project_supervisors` hiện có (min 1, max 2).

## Approach đã loại

- Tạo endpoint mới song song `/projects/import-v2` hay tương tự — user chỉ ra endpoint cũ "bị sai" nên nên sửa thẳng, tránh 2 endpoint làm cùng 1 việc.
- Dùng lại staging schema `excel_projects`/`excel_import_batches` — over-engineer, dormant, không ai dùng.

## Risks

- Đây là **breaking change** cho hành vi cũ (bỏ đọc semesterCode/majorCode từ sheet, đổi skip→upsert) — nhưng theo scout thì template cũ chưa từng khớp file thật nào của user nên rủi ro thấp.
- FE cần threading `semesterId` qua nhiều lớp (dialog → hook → service → API) — cần đảm bảo lấy đúng semester đang chọn trên `manager/projects` page.

## Unresolved questions

- GVHD1 có luôn bắt buộc không (giả định có) — cần xác nhận nếu sai khi implement.
