"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  FileClock,
  GraduationCap,
  CalendarRange,
  ClipboardCheck,
  BarChart3,
  Users2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

// Cấu hình nav sống trong client component vì icon (lucide-react) không
// serialize được khi truyền từ Server Component (layout.tsx) sang Client Component.
const NAV_CONFIG: Record<UserRole, { areaLabel: string; items: NavItem[] }> = {
  [ROLE_ADMIN]: {
    areaLabel: "Quản trị",
    items: [
      { label: "Tổng quan", href: "/admin/dashboard", icon: Settings },
      { label: "Tài khoản & phân quyền", href: "/admin/accounts", icon: Users },
      { label: "Master data", href: "/admin/master-data", icon: ShieldCheck },
      { label: "Audit log", href: "/admin/audit-log", icon: FileClock },
    ],
  },
  [ROLE_MANAGER]: {
    areaLabel: "Bộ môn",
    items: [
      { label: "Tổng quan", href: "/manager/dashboard", icon: LayoutDashboard },
      { label: "Đề tài & Nhóm", href: "/manager/projects", icon: GraduationCap },
      { label: "Đợt đánh giá", href: "/manager/rounds", icon: CalendarRange },
      { label: "Kết quả & Luồng chuyển tiếp", href: "/manager/results", icon: ClipboardCheck },
      { label: "Báo cáo", href: "/manager/reports", icon: BarChart3 },
    ],
  },
  [ROLE_LECTURER]: {
    areaLabel: "Giảng viên",
    items: [
      { label: "Tổng quan", href: "/lecturer/dashboard", icon: LayoutDashboard },
      { label: "Lịch của tôi", href: "/lecturer/schedule", icon: CalendarClock },
      { label: "Nhóm hướng dẫn", href: "/lecturer/supervised-groups", icon: Users2 },
      { label: "Nhập kết quả", href: "/lecturer/results", icon: ClipboardList },
    ],
  },
  [ROLE_STUDENT]: {
    areaLabel: "Sinh viên",
    items: [
      { label: "Tổng quan", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Lịch nhóm", href: "/student/schedule", icon: CalendarClock },
    ],
  },
};

interface AppShellProps {
  children: ReactNode;
  area: UserRole;
}

export function AppShell({ children, area }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { areaLabel, items: navItems } = NAV_CONFIG[area];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <CalendarClock className="size-5 text-primary" />
          <span className="font-semibold text-sidebar-foreground">Capstone Scheduler</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {areaLabel}
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <CalendarClock className="size-5 text-primary" />
            <span className="font-semibold">Capstone Scheduler</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.fullName ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {user ? ROLE_LABEL_VI[user.role as UserRole] : ""}
              </p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {(user?.fullName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Đăng xuất">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-muted/40 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
