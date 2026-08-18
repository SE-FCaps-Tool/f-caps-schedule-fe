import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT } from "@/lib/types/roles";

// Next.js 16: Middleware was renamed to Proxy (node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md)

const ROLE_HOME: Record<string, string> = {
  [ROLE_ADMIN]: "/admin/dashboard",
  [ROLE_MANAGER]: "/manager/dashboard",
  [ROLE_LECTURER]: "/lecturer/dashboard",
  [ROLE_STUDENT]: "/student/dashboard",
};

const getUserRole = (token: string | undefined): string | null => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token) as { role?: string; exp?: number } | null;
    if (decoded?.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded?.role ?? null;
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;
  const role = getUserRole(token);

  if (pathname.endsWith(".xml") || pathname.endsWith(".json")) return NextResponse.next();

  // Không có trang chủ — "/" và mọi route chưa đăng nhập đều dồn về /login
  const authRoutes = ["/login"];
  const isAuthRoute = authRoutes.some((r) => pathname === r);

  // Chưa đăng nhập
  if (!token || !role) {
    if (isAuthRoute) return NextResponse.next();
    const res = NextResponse.redirect(new URL("/login", request.url));
    if (token) res.cookies.delete("authToken");
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml)$).*)",
  ],
};
