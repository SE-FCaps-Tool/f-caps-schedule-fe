// Nhãn hiển thị cho các action đã biết — backend không có endpoint liệt kê action
// enum nên đây chỉ là bản dịch tốt nhất-hiện-biết; action lạ sẽ fallback về
// formatActionLabel() thay vì hiện nguyên chuỗi SCREAMING_SNAKE_CASE.
const KNOWN_ACTION_LABEL: Record<string, string> = {
  ACCOUNT_CREATED: "Tạo tài khoản",
  ACCOUNT_STATUS_CHANGED: "Đổi trạng thái tài khoản",
  ACCOUNT_ROLE_ASSIGNED: "Gán vai trò",
  ACCOUNT_ROLE_REMOVED: "Gỡ vai trò",
  MASTER_DATA_CREATED: "Tạo master data",
  ROUND_TRANSITION: "Chuyển trạng thái đợt",
  ROUND_UNLOCKED: "Mở khóa đợt",
  SCHEDULE_PUBLISHED: "Công bố lịch",
  SESSION_EDITED: "Sửa lịch",
  SESSION_POSTPONED: "Hoãn phiên",
  GROUP_LEADER_CHANGED: "Đổi trưởng nhóm",
};

export function actionLabel(action: string): string {
  if (KNOWN_ACTION_LABEL[action]) return KNOWN_ACTION_LABEL[action];
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const KNOWN_ACTIONS = Object.keys(KNOWN_ACTION_LABEL);
