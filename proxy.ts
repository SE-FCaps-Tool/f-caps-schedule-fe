import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, ROLE_HOME } from "@/lib/types/roles";
import { SESSION_ROLE_COOKIE } from "@/lib/constants/auth";

// Next.js 16: Middleware was renamed to Proxy (node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md)
//
// Session thật là cookie HttpOnly do backend set (docs/auth.md), proxy không đọc được nó.
// `session_role` là cookie đọc được FE tự set sau khi login/hydrate — chỉ dùng để định tuyến
// UX, không phải biên bảo mật; mọi request vẫn được backend xác thực bằng session cookie thật,
// và một session hết hạn phía server sẽ lộ ra qua 401 ở `/auth/me` (xem useAuthSyncAcrossTabs).

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(SESSION_ROLE_COOKIE)?.value || null;

  if (pathname.endsWith(".xml") || pathname.endsWith(".json")) return NextResponse.next();

  // Không có trang chủ — "/" và mọi route chưa đăng nhập đều dồn về /login
  const authRoutes = ["/login"];
  const isAuthRoute = authRoutes.some((r) => pathname === r);

  // Chưa đăng nhập
  if (!role) {
    if (isAuthRoute) return NextResponse.next();
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_ROLE_COOKIE);
    return res;
  }

  // Đã đăng nhập mà vào trang auth hoặc "/" ⇒ về dashboard theo role
  if (isAuthRoute || pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/login", request.url));
  }

  const roleAreas: Record<string, string> = {
    [ROLE_ADMIN]: "/admin",
    [ROLE_MANAGER]: "/manager",
    [ROLE_LECTURER]: "/lecturer",
    [ROLE_STUDENT]: "/student",
  };

  const ownArea = roleAreas[role];
  const isOwnArea = ownArea && pathname.startsWith(ownArea);

  // Trang lịch cá nhân dùng chung cho mọi role đã đăng nhập (PRD FR-8.1)
  const isSharedRoute = pathname.startsWith("/my-schedule");

  if (isOwnArea || isSharedRoute) return NextResponse.next();

  return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/login", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|lottie)$).*)",
  ],
};
