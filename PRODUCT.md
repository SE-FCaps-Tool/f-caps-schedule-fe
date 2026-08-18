# Product

## Register

product

## Users

Bốn role dùng hệ thống hàng ngày trong một học kỳ tại Khoa Kỹ thuật Phần mềm, Đại học FPT:

- **Admin** (1-2 người): cán bộ IT, dùng thấp — đầu kỳ và khi có sự cố.
- **Manager** (1-3 người): trưởng bộ môn / thư ký, dùng cao — dày đặc trước mỗi đợt đánh giá.
- **Lecturer** (~26 người): giảng viên, dùng trung bình — đăng ký lịch rảnh, chấm phiên, xem lịch cá nhân.
- **Student** (~330 người, theo nhóm 4-5): sinh viên năm cuối, dùng thấp — xem lịch nhóm, kết quả; Leader đăng ký slot.

Phần lớn thao tác diễn ra trên điện thoại (đăng ký lịch rảnh, xem lịch) hoặc desktop (xếp lịch, quản trị).

## Product Purpose

Thay thế quy trình xếp lịch đánh giá Capstone thủ công trên Excel (~8-16h công/đợt, dễ sai ràng buộc, tải lệch giữa giảng viên) bằng một hệ thống quản lý vòng đời lịch đánh giá: thu lịch rảnh, xếp lịch tự động theo ràng buộc cứng/mềm, công bố, xử lý thay đổi có audit log, và điều hướng nhóm qua các đợt (Review 1/2 → Defense 1.1 → Defense 1.2/2). Thành công là: xếp lịch dưới 1 giờ, 0 vi phạm ràng buộc cứng, độ lệch tải giữa giảng viên ≤ 1.5×.

## Brand Personality

Rõ ràng, đáng tin, gọn gàng — công cụ học thuật nghiêm túc nhưng thân thiện, không diêm dúa. Trắng làm nền chủ đạo, cam làm điểm nhấn hành động và trạng thái quan trọng. Ưu tiên độ rõ thông tin (lịch, trạng thái, deadline) hơn trang trí.

## Anti-references

Không có tham khảo cụ thể được chỉ định. Tránh: giao diện dashboard SaaS rập khuôn (thẻ số liệu gradient, card đồng dạng lặp lại), quá nhiều màu sắc cạnh tranh với cam thương hiệu, chữ nhỏ khó đọc trên điện thoại khi đăng ký lịch rảnh.

## Design Principles

- **Trạng thái trước, trang trí sau**: mọi màn hình ưu tiên trả lời "việc gì cần làm, hạn nào, còn bao lâu" trước khi đẹp.
- **Điện thoại là công dân hạng nhất** cho các luồng đăng ký lịch rảnh / xem lịch — không chỉ desktop-first thu nhỏ.
- **Cam có chủ đích**: dùng cho hành động chính, cảnh báo, trạng thái cần chú ý — không rải đều trang trí.
- **Không giấu ràng buộc**: khi hệ thống chặn hoặc cảnh báo (trùng lịch, quá hạn, thiếu điều kiện), lý do phải hiển thị rõ ngay tại chỗ, không chỉ trong log.
- **Mỗi role một góc nhìn gọn**: Student/Lecturer không cần thấy độ phức tạp xếp lịch của Manager; giao diện thu gọn theo đúng việc của từng role.

## Accessibility & Inclusion

Chưa có yêu cầu WCAG cụ thể được xác nhận — áp dụng mặc định thực hành tốt: tương phản văn bản ≥ 4.5:1, mục tiêu chạm ≥ 40px trên di động, hỗ trợ `prefers-reduced-motion`, giao diện tiếng Việt có dấu đầy đủ.
