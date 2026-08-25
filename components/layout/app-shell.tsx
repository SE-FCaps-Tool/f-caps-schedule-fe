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
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
import { useLecturerInvitations } from "@/hooks/lecturer/useLecturerPortal";
import { ROLE_LABEL_EN } from "@/lib/utils/roleLabels";
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
        ],
      },
      {
        label: "Lịch & tham gia",
        items: [
          { label: "Lời mời", href: "/lecturer/invitations", icon: Mail },
          { label: "Đăng ký lịch rảnh", href: "/lecturer/availability", icon: CalendarCheck },
          { label: "Lịch của tôi", href: "/lecturer/schedule", icon: CalendarClock },
        ],
      },
      {
        label: "Theo dõi",
        items: [
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

function NavigationGroups({
  groups,
  pathname,
  disabledHrefs,
  onDisabledClick,
  navQuery,
  pendingInvitationCount,
  mobile = false,
}: {
  groups: NavGroup[];
  pathname: string;
  disabledHrefs?: string[];
  onDisabledClick?: (href: string) => void;
  navQuery?: string;
  pendingInvitationCount: number;
  mobile?: boolean;
}) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className={cn(groupIndex > 0 && "mt-5")}>
          {group.label && (
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground/75 uppercase">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = isNavItemActive(item, pathname);
              const isDisabled = disabledHrefs?.includes(item.href) ?? false;
              const badge = item.href === "/lecturer/invitations" && pendingInvitationCount > 0 ? pendingInvitationCount : undefined;
              const itemClassName = cn(
                "group/nav flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                isDisabled && "cursor-not-allowed text-sidebar-foreground/40 hover:bg-transparent hover:text-sidebar-foreground/40"
              );
              const iconClassName = cn(
                "size-4 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-sidebar-accent-foreground",
                isDisabled && "text-sidebar-foreground/40"
              );

              if (isDisabled) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => onDisabledClick?.(item.href)}
                    className={itemClassName}
                    aria-disabled="true"
                  >
                    <item.icon className={iconClassName} />
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    <Lock className="size-3.5 shrink-0" />
                  </button>
                );
              }

              const link = (
                <Link
                  key={item.href}
                  href={navQuery ? `${item.href}${navQuery}` : item.href}
                  className={itemClassName}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className={iconClassName} />
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {badge !== undefined && (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold tabular-nums",
                        isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );

              return mobile ? <SheetClose key={item.href} render={link} /> : link;
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function UserMenu({
  displayName,
  roleLabel,
  email,
  onLogout,
  side,
  compact = false,
}: {
  displayName: string;
  roleLabel: string;
  email: string;
  onLogout: () => void;
  side: "top" | "bottom";
  compact?: boolean;
}) {
  const initial = (displayName || roleLabel || "?").trim().slice(0, 1).toUpperCase();

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
              <span className="block truncate text-sm font-medium text-sidebar-foreground">{displayName || "Chưa cập nhật tên"}</span>
              <span className="block truncate text-xs text-muted-foreground">{roleLabel || "Chưa cập nhật vai trò"}</span>
              <span className="block truncate text-[11px] text-muted-foreground/80">{email || "Chưa cập nhật email"}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={side} className="w-72 max-w-[calc(100vw-1rem)]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <dl className="space-y-1.5">
              <div>
                <dt className="text-[11px] text-muted-foreground">Tên người dùng</dt>
                <dd className="truncate text-sm font-medium text-foreground">{displayName || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Vai trò</dt>
                <dd className="truncate text-sm text-foreground">{roleLabel || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Email</dt>
                <dd className="break-all text-sm text-foreground">{email || "Chưa cập nhật"}</dd>
              </div>
            </dl>
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
  const { data: lecturerInvitations } = useLecturerInvitations({ enabled: area === ROLE_LECTURER });
  const pendingInvitationCount = lecturerInvitations?.filter((invitation) => invitation.status === "PENDING").length ?? 0;

  const activeItem = navItems.find((item) => isNavItemActive(item, pathname));
  const displayName = user?.displayName ?? "";
  const roleLabel = user ? ROLE_LABEL_EN[user.role as UserRole] : "";
  const email = user?.email ?? "";

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="size-4" />
          </span>
          <span className="font-semibold tracking-tight text-sidebar-foreground">Capstone Scheduler</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {areaLabel}
          </p>
          <NavigationGroups
            groups={groups}
            pathname={pathname}
            disabledHrefs={disabledHrefs}
            onDisabledClick={onDisabledClick}
            navQuery={navQuery}
            pendingInvitationCount={pendingInvitationCount}
          />
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <UserMenu
            displayName={displayName}
            roleLabel={roleLabel}
            email={email}
            onLogout={logout}
            side="top"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Mở menu điều hướng"
                title="Mở menu điều hướng"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(86vw,18rem)] gap-0 p-0">
                <SheetHeader className="border-b border-border px-5 py-4 text-left">
                  <SheetTitle className="flex items-center gap-2.5 tracking-tight">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarClock className="size-4" />
                    </span>
                    Capstone Scheduler
                  </SheetTitle>
                  <SheetDescription className="sr-only">Điều hướng khu vực {areaLabel}</SheetDescription>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                  <p className="px-3 pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{areaLabel}</p>
                  <NavigationGroups
                    groups={groups}
                    pathname={pathname}
                    disabledHrefs={disabledHrefs}
                    onDisabledClick={onDisabledClick}
                    navQuery={navQuery}
                    pendingInvitationCount={pendingInvitationCount}
                    mobile
                  />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="truncate font-semibold tracking-tight">Capstone Scheduler</span>
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
              displayName={displayName}
              roleLabel={roleLabel}
              email={email}
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
