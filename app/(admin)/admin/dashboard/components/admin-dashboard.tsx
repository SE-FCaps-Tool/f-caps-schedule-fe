"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  GraduationCap,
  HardDrive,
  Layers3,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Users2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/admin/useAccounts";
import { useAudit } from "@/hooks/admin/useAudit";
import { useCommittees } from "@/hooks/useCommittees";
import { useLecturers } from "@/hooks/useLecturers";
import { useRooms } from "@/hooks/useRooms";
import { useSemesters } from "@/hooks/useSemesters";
import { actionLabel } from "../../audit-log/components/action-labels";
import { formatDate } from "@/lib/utils/formatDate";

type Tone = "violet" | "sky" | "emerald" | "amber";

const toneClasses: Record<Tone, { icon: string; value: string; progress: string }> = {
  violet: { icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300", value: "text-violet-700 dark:text-violet-300", progress: "bg-violet-500" },
  sky: { icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300", value: "text-sky-700 dark:text-sky-300", progress: "bg-sky-500" },
  emerald: { icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", value: "text-emerald-700 dark:text-emerald-300", progress: "bg-emerald-500" },
  amber: { icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300", value: "text-amber-700 dark:text-amber-300", progress: "bg-amber-500" },
};

const MOCK = {
  activitySeries: [42, 56, 48, 72, 61, 78, 86, 74, 92, 88, 105, 98, 116, 109, 126, 120, 138, 132],
  activityLabels: ["T2", "T3", "T4", "T5", "T6", "T7"],
  roleDistribution: [
    { label: "Sinh viên", value: 68, color: "#8b5cf6" },
    { label: "Giảng viên", value: 24, color: "#38bdf8" },
    { label: "Quản lý", value: 6, color: "#10b981" },
    { label: "Admin", value: 2, color: "#f59e0b" },
  ],
  health: [
    { label: "API & đồng bộ dữ liệu", detail: "Hoạt động bình thường", value: 99, color: "bg-emerald-500" },
    { label: "Tác vụ nền", detail: "Không có hàng đợi lỗi", value: 94, color: "bg-sky-500" },
    { label: "Dung lượng lưu trữ", detail: "Còn nhiều không gian", value: 72, color: "bg-violet-500" },
  ],
  recentActivity: [
    { id: "mock-1", actor: "Nguyễn Minh Sang", action: "đã tạo học kỳ SU27", time: "12 phút trước", tone: "violet" },
    { id: "mock-2", actor: "Trương Long", action: "đã cập nhật danh sách phòng", time: "38 phút trước", tone: "sky" },
    { id: "mock-3", actor: "Lê Thị Hải Hà", action: "đã gán vai trò MANAGER", time: "1 giờ trước", tone: "emerald" },
    { id: "mock-4", actor: "Hệ thống", action: "đã hoàn tất đồng bộ dữ liệu", time: "2 giờ trước", tone: "amber" },
  ],
  checklist: [
    { label: "Cập nhật mốc thời gian SU27", detail: "Cần hoàn thành trong 2 ngày", done: false },
    { label: "Rà soát 4 tài khoản bị khóa", detail: "Đang chờ admin kiểm tra", done: false },
    { label: "Kiểm tra sao lưu dữ liệu", detail: "Lần gần nhất: hôm qua 23:00", done: true },
  ],
} as const;

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{eyebrow.toLocaleLowerCase("vi-VN")}</p>
        <h2 className="mt-1 text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, trend, icon: Icon, tone }: { label: string; value: string; detail: string; trend: string; icon: LucideIcon; tone: Tone }) {
  const colors = toneClasses[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex size-10 items-center justify-center rounded-xl ${colors.icon}`}>
          <Icon className="size-5" />
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight className="size-3.5" />
          {trend}
        </span>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${colors.value}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ActivityChart() {
  const max = Math.max(...MOCK.activitySeries);
  const points = MOCK.activitySeries.map((value, index) => {
    const x = (index / (MOCK.activitySeries.length - 1)) * 600;
    const y = 178 - (value / max) * 135;
    return `${x},${y}`;
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point}`).join(" ");
  const areaPath = `${linePath} L 600 205 L 0 205 Z`;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Hoạt động hệ thống</span>
        <span className="font-medium text-foreground">+18,4% so với tuần trước</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl bg-muted/30 px-2 pt-3">
        <svg viewBox="0 0 600 220" className="h-48 w-full" role="img" aria-label="Biểu đồ hoạt động hệ thống 18 ngày gần nhất">
          <defs>
            <linearGradient id="admin-activity-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[55, 105, 155, 205].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />)}
          <path d={areaPath} fill="url(#admin-activity-fill)" />
          <path d={linePath} fill="none" stroke="#8b5cf6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="600" cy="54" r="5" fill="#8b5cf6" stroke="white" strokeWidth="3" />
        </svg>
        <div className="flex justify-between px-1 pb-3 text-[11px] text-muted-foreground">
          {MOCK.activityLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-semibold tabular-nums">138</p><p className="text-[11px] text-muted-foreground">cao nhất/ngày</p></div>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-semibold tabular-nums">96</p><p className="text-[11px] text-muted-foreground">trung bình/ngày</p></div>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-semibold tabular-nums">18</p><p className="text-[11px] text-muted-foreground">ngày theo dõi</p></div>
      </div>
    </div>
  );
}

function RoleDonut() {
  const segments = MOCK.roleDistribution.map((item) => {
    const index = MOCK.roleDistribution.indexOf(item);
    const start = MOCK.roleDistribution.slice(0, index).reduce((total, current) => total + current.value, 0);
    return `${item.color} ${start}% ${start + item.value}%`;
  }).join(", ");
  const style = { background: `conic-gradient(${segments})` } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative flex size-40 shrink-0 items-center justify-center rounded-full" style={style}>
        <div className="flex size-24 flex-col items-center justify-center rounded-full bg-card shadow-sm">
          <span className="text-2xl font-semibold tabular-nums">100</span>
          <span className="text-[11px] text-muted-foreground">tài khoản mẫu</span>
        </div>
      </div>
      <div className="w-full max-w-48 space-y-3">
        {MOCK.roleDistribution.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-muted-foreground">{item.label}</span></span>
            <span className="font-medium tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, detail, value, color }: { label: string; detail: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{label}</span><span className="shrink-0 font-medium tabular-nums">{value}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { data: accounts, isLoading: accountsLoading, isError: accountsError } = useAccounts();
  const { data: recentActivity, isLoading: auditLoading } = useAudit({ limit: 6 });
  const { data: semesters } = useSemesters({ pageSize: 200 });
  const { data: lecturers } = useLecturers();
  const { data: rooms } = useRooms();
  const { data: committees } = useCommittees();

  const activeCount = accounts?.filter((account) => account.status === "ACTIVE").length ?? 0;
  const inactiveCount = accounts ? accounts.length - activeCount : 0;
  const accountsById = new Map((accounts ?? []).map((account) => [account.id, account]));
  const activeSemester = semesters?.find((semester) => semester.status === "ACTIVE")?.code ?? "SU26";
  const lecturerCount = lecturers?.length ?? 42;
  const roomCount = rooms?.length ?? 18;
  const committeeCount = committees?.length ?? 32;
  const hasRealActivity = Boolean(recentActivity?.length);
  const activityItems = hasRealActivity
    ? recentActivity!.slice(0, 5).map((activity) => ({
        id: String(activity.id),
        actor: activity.actorId == null ? "Hệ thống" : accountsById.get(activity.actorId)?.displayName ?? `Tài khoản #${activity.actorId}`,
        action: actionLabel(activity.action),
        time: formatDate(activity.occurredAt, "DD/MM HH:mm"),
        tone: "violet",
      }))
    : MOCK.recentActivity;

  const resources = [
    { label: "Tài khoản", value: accounts?.length ?? 128, detail: `${accounts ? activeCount : 121} đang hoạt động`, icon: Users2, href: "/admin/accounts", tone: "violet" as Tone },
    { label: "Giảng viên", value: lecturerCount, detail: "Danh sách giảng dạy", icon: GraduationCap, href: "/admin/master-data/lecturers", tone: "sky" as Tone },
    { label: "Phòng bảo vệ", value: roomCount, detail: "Phòng đã cấu hình", icon: HardDrive, href: "/admin/master-data/rooms", tone: "emerald" as Tone },
    { label: "Hội đồng mẫu", value: committeeCount, detail: "Sẵn sàng tái sử dụng", icon: Layers3, href: "/admin/master-data/committees", tone: "amber" as Tone },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card px-5 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground">bảng điều hành admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tổng quan hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Theo dõi tài khoản, dữ liệu nền và sức khỏe vận hành của F-CAPS trong một màn hình.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Dữ liệu cập nhật</span>
            <Link href="/admin/accounts" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"><Users2 className="size-4" />Quản lý tài khoản</Link>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Học kỳ đang hoạt động: <strong className="text-foreground">{activeSemester}</strong></span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" />Quyền truy cập: ADMIN</span>
          <span className="inline-flex items-center gap-1.5"><Database className="size-3.5" />Một số chỉ số bên dưới là mockup data</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tài khoản hệ thống" value={accounts ? String(accounts.length) : "128"} detail={accountsError ? "Đang hiển thị số liệu mẫu" : `${activeCount || 121} đang hoạt động`} trend="+8,2%" icon={Users2} tone="violet" />
        <MetricCard label="Giảng viên" value={String(lecturerCount)} detail="Có thể tham gia vận hành" trend="+4,6%" icon={GraduationCap} tone="sky" />
        <MetricCard label="Học kỳ đã tạo" value={String(semesters?.length ?? 4)} detail="1 học kỳ đang hoạt động" trend="+1 mới" icon={CalendarDays} tone="emerald" />
        <MetricCard label="Tài khoản cần rà soát" value={String(inactiveCount || 4)} detail="Bị khóa hoặc thiếu vai trò" trend="-2,1%" icon={LockKeyhole} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeading eyebrow="Sức khỏe hệ thống" title="Các dịch vụ đang vận hành" action={<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="size-3.5" />Ổn định</span>} />
          <div className="mt-6 space-y-5">{MOCK.health.map((item) => <ProgressRow key={item.label} {...item} />)}</div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/70 pt-4 text-center"><div><p className="text-lg font-semibold tabular-nums">99,98%</p><p className="text-[11px] text-muted-foreground">uptime tháng này</p></div><div><p className="text-lg font-semibold tabular-nums">0</p><p className="text-[11px] text-muted-foreground">sự cố nghiêm trọng</p></div><div><p className="text-lg font-semibold tabular-nums">2 phút</p><p className="text-[11px] text-muted-foreground">đồng bộ gần nhất</p></div></div>
        </Panel>
        <Panel>
          <PanelHeading eyebrow="Phân bổ người dùng" title="Cơ cấu tài khoản theo vai trò" action={<Link href="/admin/accounts" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Xem tài khoản <ChevronRight className="size-3.5" /></Link>} />
          <div className="mt-6"><RoleDonut /></div>
          <div className="mt-6 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Gợi ý:</span> tỷ lệ tài khoản mẫu giúp admin theo dõi nhanh cơ cấu quyền trước khi mở học kỳ mới.</div>
        </Panel>
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeading eyebrow="Nhịp vận hành" title="Hoạt động hệ thống trong 18 ngày gần nhất" action={<span className="text-xs text-muted-foreground">Dữ liệu mẫu</span>} />
          <ActivityChart />
        </Panel>
        <Panel>
          <PanelHeading eyebrow="Nhật ký gần đây" title="Các thao tác mới nhất" action={<Link href="/admin/audit-log" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Mở audit log <ChevronRight className="size-3.5" /></Link>} />
          {auditLoading ? <div className="mt-5 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : <div className="mt-5 space-y-4">{activityItems.map((item) => <div key={item.id} className="flex gap-3"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[item.tone as Tone].icon}`}><Activity className="size-4" /></span><div className="min-w-0"><p className="text-sm leading-5"><span className="font-medium">{item.actor}</span> <span className="text-muted-foreground">{item.action}</span></p><p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p></div></div>)}</div>}
          {!hasRealActivity && !auditLoading && <p className="mt-5 text-[11px] text-muted-foreground">Đang dùng nội dung mẫu khi chưa có audit log từ hệ thống.</p>}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="flex flex-col">
          <PanelHeading eyebrow="Danh mục nền" title="Tài nguyên đang được cấu hình" action={<Link href="/admin/master-data" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Mở cấu hình <ChevronRight className="size-3.5" /></Link>} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{resources.map((resource) => { const Icon = resource.icon; return <Link key={resource.label} href={resource.href} className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40"><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[resource.tone].icon}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{resource.label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{resource.detail}</span></span><span className="text-lg font-semibold tabular-nums">{resource.value}</span></Link>; })}</div>
          <div className="mt-auto grid grid-cols-3 gap-3 border-t border-border/70 pt-5 text-center"><div><p className="text-lg font-semibold tabular-nums">100%</p><p className="text-[11px] text-muted-foreground">danh mục sẵn sàng</p></div><div><p className="text-lg font-semibold tabular-nums">2 phút</p><p className="text-[11px] text-muted-foreground">đồng bộ gần nhất</p></div><div><p className="text-lg font-semibold tabular-nums">SU26</p><p className="text-[11px] text-muted-foreground">đang sử dụng</p></div></div>
        </Panel>
        <Panel>
          <PanelHeading eyebrow="Việc cần làm" title="Danh sách kiểm tra của admin" action={<button type="button" onClick={() => toast.info("Checklist sẽ được nối với notification center ở phiên bản tiếp theo")} className="text-xs font-medium text-primary hover:underline">Cài đặt nhắc việc</button>} />
          <div className="mt-4 divide-y divide-border/70">{MOCK.checklist.map((item) => <div key={item.label} className="flex items-start gap-3 py-3 first:pt-1"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${item.done ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}>{item.done ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p></div><ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" /></div>)}</div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-xs"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><ServerCog className="size-3.5" />2 việc cần xử lý</span><Button variant="ghost" size="xs" onClick={() => toast.info("Tính năng task center đang ở chế độ mockup")}>Mở task center</Button></div>
        </Panel>
      </div>

      {inactiveCount > 0 && <Link href="/admin/accounts" className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><CircleAlert className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{inactiveCount} tài khoản đang bị khóa</span><span className="mt-0.5 block text-xs text-muted-foreground">Kiểm tra lý do trước khi phân công cho học kỳ tiếp theo.</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></Link>}
      {accountsError && <div className="flex items-center gap-2 text-xs text-muted-foreground"><WifiOff className="size-3.5" />Một số số liệu tài khoản đang hiển thị theo mockup vì API chưa phản hồi.</div>}
      {accountsLoading && <div className="sr-only">Đang tải dữ liệu tài khoản</div>}
    </div>
  );
}
