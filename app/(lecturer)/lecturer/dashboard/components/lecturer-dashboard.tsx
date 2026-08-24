"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MoreHorizontal,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

interface Invitation {
  id: number;
  round: string;
  date: string;
  detail: string;
  status: InvitationStatus;
}

type SessionTone = "sky" | "violet" | "emerald";

const MOCK_INVITATIONS: Invitation[] = [
  { id: 1, round: "Defense 1.1", date: "28/08/2026", detail: "45 phút · 2 nhóm", status: "PENDING" },
  { id: 2, round: "Review 2", date: "03/09/2026", detail: "60 phút · 3 nhóm", status: "PENDING" },
  { id: 3, round: "Review 1", date: "18/08/2026", detail: "45 phút · 2 nhóm", status: "ACCEPTED" },
];

const MOCK_SCHEDULE = [
  {
    day: "25",
    weekday: "T3",
    time: "08:30 – 09:15",
    title: "Review 1",
    group: "GRP-SU26SE003 · Phạm Văn Học",
    room: "B-203",
    tone: "sky" as SessionTone,
  },
  {
    day: "25",
    weekday: "T3",
    time: "09:30 – 10:15",
    title: "Review 1",
    group: "GRP-SU26SE014 · Nguyễn Kỳ Vỹ",
    room: "B-203",
    tone: "sky" as SessionTone,
  },
  {
    day: "27",
    weekday: "T5",
    time: "13:30 – 14:15",
    title: "Review 1",
    group: "GRP-SU26SE018 · Nguyễn Phạm Thu Hà",
    room: "A-105",
    tone: "sky" as SessionTone,
  },
  {
    day: "29",
    weekday: "T7",
    time: "08:00 – 08:45",
    title: "Defense 1.1",
    group: "GRP-SU26SE043 · Lê Minh Đức",
    room: "C-301",
    tone: "violet" as SessionTone,
  },
];

const MOCK_GROUPS = [
  { code: "GRP-SU26SE003", title: "Nền tảng học trực tuyến", members: 4, progress: 82, status: "Đang triển khai" },
  { code: "GRP-SU26SE014", title: "Trợ lý học tập cá nhân", members: 5, progress: 68, status: "Đang triển khai" },
  { code: "GRP-SU26SE018", title: "Quản lý phòng lab", members: 4, progress: 54, status: "Cần cập nhật" },
];

const SUMMARY = [
  { label: "Phiên sắp tới", value: "4", detail: "trong 7 ngày", icon: CalendarDays, tone: "sky" },
  { label: "Nhóm hướng dẫn", value: "6", detail: "3 nhóm cần cập nhật", icon: UsersRound, tone: "violet" },
  { label: "Lịch rảnh đã gửi", value: "82%", detail: "3 đợt đánh giá", icon: CheckCircle2, tone: "emerald" },
];

const SESSION_TONE_CLASSES: Record<SessionTone, { dot: string; label: string }> = {
  sky: { dot: "bg-sky-500", label: "text-sky-700" },
  violet: { dot: "bg-violet-500", label: "text-violet-700" },
  emerald: { dot: "bg-emerald-500", label: "text-emerald-700" },
};

const SUMMARY_TONE_CLASSES: Record<string, { surface: string; icon: string; value: string }> = {
  sky: { surface: "bg-sky-50", icon: "text-sky-700", value: "text-sky-700" },
  violet: { surface: "bg-violet-50", icon: "text-violet-700", value: "text-violet-700" },
  emerald: { surface: "bg-emerald-50", icon: "text-emerald-700", value: "text-emerald-700" },
};

function InvitationStatus({ status }: { status: InvitationStatus }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
        Chờ phản hồi
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", status === "ACCEPTED" ? "text-emerald-700" : "text-muted-foreground")}>
      <CheckCircle2 className="size-3.5" />
      {status === "ACCEPTED" ? "Đã nhận lời" : "Đã từ chối"}
    </span>
  );
}

export function LecturerDashboard() {
  const [invitations, setInvitations] = useState(MOCK_INVITATIONS);
  const pendingCount = invitations.filter((invitation) => invitation.status === "PENDING").length;
  const hasPendingInvitations = pendingCount > 0;

  function respondToInvitation(id: number, status: Extract<InvitationStatus, "ACCEPTED" | "DECLINED">) {
    setInvitations((current) => current.map((invitation) => (invitation.id === id ? { ...invitation, status } : invitation)));
  }

  return (
    <div className="w-full pb-4">
      <header className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Thứ Ba, 25 tháng 8, 2026</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">Chào buổi sáng, Minh Anh</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Đây là những việc đang chờ bạn trong tuần này.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/lecturer/schedule" />}>
            <CalendarDays />
            Lịch của tôi
          </Button>
          <Button nativeButton={false} render={<Link href="/lecturer/availability" />}>
            Đăng ký lịch rảnh
            <ArrowUpRight />
          </Button>
        </div>
      </header>

      <section
        className={cn(
          "mt-4 flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
          hasPendingInvitations ? "border-border bg-muted/35" : "border-emerald-200 bg-emerald-50/70"
        )}
        aria-label="Việc cần xử lý"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              hasPendingInvitations ? "bg-primary text-primary-foreground" : "bg-emerald-100 text-emerald-700"
            )}
            aria-hidden
          >
            {hasPendingInvitations ? <Mail className="size-4" /> : <CheckCircle2 className="size-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {hasPendingInvitations ? `Bạn có ${pendingCount} lời mời cần phản hồi` : "Bạn đã xử lý hết lời mời"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {hasPendingInvitations ? "Phản hồi trước ngày 28/08 để được đưa vào lịch xếp." : "Lịch sắp tới của bạn đã được cập nhật."}
            </p>
          </div>
        </div>
        {hasPendingInvitations ? (
          <Link href="#invitations" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-foreground hover:text-primary sm:self-auto">
            Xem lời mời
            <ArrowUpRight className="size-4" />
          </Link>
        ) : (
          <Link href="/lecturer/schedule" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-foreground hover:text-emerald-700 sm:self-auto">
            Xem lịch của tôi
            <ArrowUpRight className="size-4" />
          </Link>
        )}
      </section>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <main className="min-w-0">
          <section aria-labelledby="next-session-title">
            <div className="flex items-center justify-between gap-4">
              <h2 id="next-session-title" className="text-lg font-semibold tracking-tight">Phiên sắp diễn ra</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                Đã xác nhận
              </span>
            </div>

            <article className="mt-3 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="text-[11px] font-semibold uppercase">T3</span>
                    <span className="text-2xl leading-none font-semibold tabular-nums">25</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">Review 1</h3>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Đã xác nhận</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">GRP-SU26SE003 · Phạm Văn Học</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />08:30 – 09:15</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />Phòng B-203</span>
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/lecturer/schedule" />}>
                  Xem chi tiết
                  <ArrowUpRight />
                </Button>
              </div>
              <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-600" />
                Bạn là reviewer 2 · Có mặt trước 08:15
              </div>
            </article>
          </section>

          <section className="mt-5" aria-labelledby="schedule-title">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <h2 id="schedule-title" className="text-lg font-semibold tracking-tight">Lịch sắp tới</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">25 – 29/08</span>
              </div>
              <Link href="/lecturer/schedule" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary">
                Xem toàn bộ
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-border border-y border-border">
              {MOCK_SCHEDULE.slice(1).map((session) => (
                <Link key={`${session.day}-${session.time}`} href="/lecturer/schedule" className="group flex min-w-0 items-center gap-3 py-3 transition-colors hover:bg-muted/35 sm:grid sm:grid-cols-[68px_minmax(0,1fr)_auto_20px] sm:gap-5">
                  <div className="w-12 shrink-0 rounded-lg bg-muted/70 px-2 py-1.5 text-center sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-left">
                    <p className="text-lg font-semibold leading-none tabular-nums">{session.day}</p>
                    <p className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{session.weekday}</p>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("flex items-center gap-2 text-sm font-semibold", SESSION_TONE_CLASSES[session.tone].label)}>
                      <span className={cn("size-2 rounded-full", SESSION_TONE_CLASSES[session.tone].dot)} aria-hidden />
                      {session.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{session.group}</p>
                  </div>
                  <div className="ml-auto shrink-0 text-right text-xs text-muted-foreground sm:ml-0">
                    <p className="font-medium text-foreground">{session.time}</p>
                    <p className="mt-1">Phòng {session.room}</p>
                  </div>
                  <ChevronRight className="hidden size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5" aria-labelledby="summary-title">
            <div className="flex items-center justify-between">
              <h2 id="summary-title" className="text-lg font-semibold tracking-tight">Tóm tắt học kỳ</h2>
              <span className="text-xs text-muted-foreground">SU26</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              {SUMMARY.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "min-w-0 bg-card p-3 sm:p-4",
                    index === SUMMARY.length - 1 && "col-span-2 sm:col-span-1"
                  )}
                >
                  <div className="flex min-w-0 gap-2.5">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", SUMMARY_TONE_CLASSES[item.tone].surface, SUMMARY_TONE_CLASSES[item.tone].icon)} aria-hidden>
                      <item.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{item.label}</p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className={cn("text-2xl font-semibold tracking-tight tabular-nums", SUMMARY_TONE_CLASSES[item.tone].value)}>{item.value}</span>
                        <span className="truncate text-xs text-muted-foreground">{item.detail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="min-w-0 space-y-5">
          <section id="invitations" className="rounded-xl border border-border bg-card" aria-labelledby="invitations-title">
            <div className="flex items-start justify-between gap-4 border-b border-border p-3">
              <div>
                <h2 id="invitations-title" className="font-semibold">Lời mời tham gia</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasPendingInvitations ? `${pendingCount} lời mời đang chờ phản hồi` : "Tất cả lời mời đã được xử lý"}
                </p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                <Mail className="size-4" />
              </span>
            </div>
            <div className="divide-y divide-border">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{invitation.round}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{invitation.date} · {invitation.detail}</p>
                    </div>
                    <InvitationStatus status={invitation.status} />
                  </div>
                  {invitation.status === "PENDING" && (
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                        onClick={() => respondToInvitation(invitation.id, "ACCEPTED")}
                      >
                        <Check className="size-4" />
                        Nhận lời
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => respondToInvitation(invitation.id, "DECLINED")}
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Link href="/lecturer/invitations" className="flex items-center justify-center gap-1.5 py-1 text-sm font-medium text-foreground hover:text-primary">
                Mở trang lời mời
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="groups-title">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="groups-title" className="font-semibold">Nhóm đang hướng dẫn</h2>
                <p className="mt-1 text-sm text-muted-foreground">Theo dõi tiến độ gần nhất</p>
              </div>
              <Link href="/lecturer/supervised-groups" aria-label="Xem tất cả nhóm hướng dẫn" title="Xem tất cả nhóm hướng dẫn" className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="size-5" />
              </Link>
            </div>
            <div className="mt-3 divide-y divide-border border-y border-border">
              {MOCK_GROUPS.slice(0, 2).map((group) => (
                <Link key={group.code} href="/lecturer/supervised-groups" className="block py-3 transition-colors hover:bg-muted/35">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", group.status === "Cần cập nhật" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700")} aria-hidden>
                      <UsersRound className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold">{group.code}</p>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{group.progress}%</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{group.title}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", group.status === "Cần cập nhật" ? "bg-amber-500" : "bg-sky-500")} style={{ width: `${group.progress}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{group.members} thành viên · {group.status}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/lecturer/supervised-groups" className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-foreground hover:text-primary">
              Xem 4 nhóm còn lại
              <ArrowUpRight className="size-4" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
