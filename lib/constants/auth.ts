// Session thật nằm ở cookie HttpOnly do backend set (docs/auth.md) — FE không đọc/ghi được nó.
// Cookie này chỉ giữ role, đọc được để proxy.ts (route guard) định tuyến theo khu vực,
// KHÔNG phải biên bảo mật — mọi request vẫn xác thực bằng session cookie thật ở server.
export const SESSION_ROLE_COOKIE = "session_role";

// Chỉ lưu thông tin hiển thị, không lưu mật khẩu hay session token.
export const AUTH_PROFILE_STORAGE_KEY = "capstone_auth_profile";
