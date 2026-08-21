"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  CalendarClock,
  ChevronRight,
  ChevronsUpDown,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  FileClock,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Users2,
  ClipboardList,
  User,
  Mail,
  CalendarCheck,
  CalendarDays,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Route con coi là thuộc mục này khi tính active/breadcrumb (vd. hub "Cấu hình" gộp nhiều trang con không lồng path) */
  matchHrefs?: string[];
}

function matchesNavHref(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavItemActive(item: NavItem, pathname: string) {
  return matchesNavHref(item.href, pathname) || (item.matchHrefs?.some((h) => matchesNavHref(h, pathname)) ?? false);
}

interface NavGroup {
  /** Không có label = nhóm ẩn (dùng cho mục Tổng quan đứng riêng đầu sidebar) */
  label?: string;
  items: NavItem[];
}

// Cấu hình nav sống trong client component vì icon (lucide-react) không
// serialize được khi truyền từ Server Component (layout.tsx) sang Client Component.
const NAV_CONFIG: Record<UserRole, { areaLabel: string; groups: NavGroup[] }> = {
  [ROLE_ADMIN]: {
    areaLabel: "Quản trị",
    groups: [
      {
        items: [
          { label: "Tổng quan", href: "/admin/dashboard", icon: Settings },
          { label: "Tài khoản & phân quyền", href: "/admin/accounts", icon: Users },
          { label: "Cấu hình", href: "/admin/master-data", icon: ShieldCheck },
          { label: "Audit log", href: "/admin/audit-log", icon: FileClock },
        ],
      },
    ],
  },
  [ROLE_MANAGER]: {
    areaLabel: "Bộ môn",
    groups: [
      { items: [{ label: "Tổng quan", href: "/manager/dashboard", icon: LayoutDashboard }] },
      {
        label: "Học vụ",
        items: [
          { label: "Đề tài", href: "/manager/projects", icon: GraduationCap },
          { label: "Nhóm sinh viên", href: "/manager/groups", icon: Users2 },
          {
            label: "Cấu hình",
            href: "/manager/master-data",
            icon: ShieldCheck,
            matchHrefs: ["/manager/lecturers", "/manager/rooms", "/manager/semesters", "/manager/timeframes"],
          },
        ],
      },
      {
        label: "Đánh giá",
        items: [
          { label: "Đợt đánh giá", href: "/manager/rounds", icon: ClipboardCheck },
          { label: "Lịch đánh giá", href: "/manager/calendar", icon: CalendarClock },
        ],
      },
      {
        label: "Kết quả",
        items: [
          { label: "Tiến độ nhóm", href: "/manager/progress", icon: TrendingUp },
          { label: "Kết quả & khắc phục", href: "/manager/results", icon: ClipboardList },
        ],
      },
      {
        label: "Báo cáo",
        items: [{ label: "Báo cáo", href: "/manager/reports", icon: BarChart3 }],
      },
    ],
  },
  [ROLE_LECTURER]: {
    areaLabel: "Giảng viên",
    groups: [
      {
        items: [
          { label: "Tổng quan", href: "/lecturer/dashboard", icon: LayoutDashboard },
          { label: "Lời mời", href: "/lecturer/invitations", icon: Mail },
          { label: "Đăng ký lịch rảnh", href: "/lecturer/availability", icon: CalendarCheck },
          { label: "Lịch của tôi", href: "/lecturer/schedule", icon: CalendarClock },
          { label: "Nhóm hướng dẫn", href: "/lecturer/supervised-groups", icon: Users2 },
          { label: "Khắc phục", href: "/lecturer/results", icon: ClipboardList },
        ],
      },
    ],
  },
  [ROLE_STUDENT]: {
    areaLabel: "Sinh viên",
    groups: [
      {
        items: [
          { label: "Tổng quan", href: "/student/dashboard", icon: LayoutDashboard },
          { label: "Đăng ký lịch", href: "/student/preferences", icon: CalendarDays },
          { label: "Lịch của nhóm", href: "/student/schedule", icon: CalendarClock },
          { label: "Kết quả", href: "/student/results", icon: Award },
        ],
      },
    ],
  },
};

interface AppShellProps {
  children: ReactNode;
  area: UserRole;
  /** Nội dung tuỳ chọn hiển thị ở header desktop, bên phải breadcrumb (vd. Semester switcher của Manager) */
  headerExtra?: ReactNode;
  /** Href của các nav item cần khoá tạm thời (vd. chưa chọn Semester Context) */
  disabledHrefs?: string[];
  onDisabledClick?: (href: string) => void;
  /** Query string (vd. "?semester=SU26") nối vào href của các nav item còn hoạt động, để giữ context qua điều hướng */
  navQuery?: string;
}

function UserMenu({
  roleLabel,
  accountLabel,
  onLogout,
  side,
  compact = false,
}: {
  roleLabel: string;
  accountLabel: string;
  onLogout: () => void;
  side: "top" | "bottom";
  compact?: boolean;
}) {
  const initial = (roleLabel || "?").slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-md p-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50",
          compact ? "shrink-0" : "w-full"
        )}
        aria-label={compact ? "Menu tài khoản" : undefined}
      >
        <Avatar className="shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">{initial}</AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">{roleLabel || "—"}</span>
              <span className="block truncate text-xs text-muted-foreground">{accountLabel}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={side} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium text-foreground">{roleLabel || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            Hồ sơ của tôi
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Cài đặt
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onLogout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children, area, headerExtra, disabledHrefs, onDisabledClick, navQuery }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { areaLabel, groups } = NAV_CONFIG[area];
  const navItems = groups.flatMap((group) => group.items);

  const activeItem = navItems.find((item) => isNavItemActive(item, pathname));

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-6">
          <CalendarClock className="size-5 text-primary" />
          <span className="font-semibold text-sidebar-foreground">Capstone Scheduler</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {areaLabel}
          </p>
          {groups.map((group, groupIndex) => (
            <div key={group.label ?? `group-${groupIndex}`} className={cn("space-y-1", groupIndex > 0 && "mt-4")}>
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = isNavItemActive(item, pathname);
                const isDisabled = disabledHrefs?.includes(item.href) ?? false;

                if (isDisabled) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => onDisabledClick?.(item.href)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent/50"
                    >
                      <item.icon className="size-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <Lock className="size-3.5 shrink-0" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={navQuery ? `${item.href}${navQuery}` : item.href}
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
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <UserMenu
            roleLabel={user ? ROLE_LABEL_VI[user.role as UserRole] : ""}
            accountLabel={user ? `Tài khoản #${user.account_id}` : ""}
            onLogout={logout}
            side="top"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <CalendarClock className="size-5 text-primary" />
            <span className="font-semibold">Capstone Scheduler</span>
          </div>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
            <span className="text-muted-foreground">{areaLabel}</span>
            {activeItem && (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className="truncate font-medium text-foreground">{activeItem.label}</span>
              </>
            )}
          </nav>

          {headerExtra && <div className="ml-auto hidden md:block">{headerExtra}</div>}

          <div className="ml-auto flex items-center gap-2 md:hidden">
            {headerExtra}
            <UserMenu
              roleLabel={user ? ROLE_LABEL_VI[user.role as UserRole] : ""}
              accountLabel={user ? `Tài khoản #${user.account_id}` : ""}
              onLogout={logout}
              side="bottom"
              compact
            />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
