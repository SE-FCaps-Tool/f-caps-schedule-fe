"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, CalendarDays, Award, LayoutDashboard, LogOut, User, Settings } from "lucide-react";
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
import type { UserRole } from "@/lib/types/roles";

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Đăng ký lịch", href: "/student/preferences", icon: CalendarDays },
  { label: "Lịch nhóm", href: "/student/schedule", icon: CalendarClock },
  { label: "Kết quả", href: "/student/results", icon: Award },
];

export function StudentHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.displayName ?? "";
  const roleLabel = user ? ROLE_LABEL_VI[user.role as UserRole] : "";
  const email = user?.email ?? "";
  const initial = (displayName || roleLabel || "?").trim().slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-16 w-full items-center px-4 md:px-6">
        <Link href="/student/dashboard" className="flex shrink-0 items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          <span className="hidden font-semibold sm:inline">Capstone Scheduler</span>
        </Link>

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-3.5",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar>
              <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-1rem)]">
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
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
