"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Award,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSpreadsheet,
  GraduationCap,
  Layers3,
  MoreHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users2,
  Zap,
} from "lucide-react";
import { useSemesterContext } from "../../_shared/semester-context";

/** Mockup-only data. Replace these fixtures with report endpoints after the visual direction is approved. */
const MOCK = {
  kpis: [
    { label: "Đề tài", value: "74", note: "+12% so với kỳ trước", icon: Layers3, tone: "violet", trend: "up", spark: [38, 42, 41, 49, 52, 58, 65, 74] },
    { label: "Nhóm sinh viên", value: "30", note: "27 nhóm đã gắn đề tài", icon: Users2, tone: "sky", trend: "up", spark: [21, 22, 23, 23, 25, 26, 28, 30] },
    { label: "Giảng viên tham gia", value: "42", note: "38 đã xác nhận lịch", icon: GraduationCap, tone: "amber", trend: "up", spark: [24, 27, 29, 31, 33, 36, 39, 42] },
    { label: "Tỷ lệ xếp lịch", value: "82%", note: "8 nhóm đang chờ xử lý", icon: CalendarCheck2, tone: "emerald", trend: "up", spark: [42, 48, 53, 58, 61, 69, 75, 82] },
  ],
  projectStatus: [
    { label: "Đang đánh giá", value: 44, color: "#38bdf8" },
    { label: "Nháp", value: 16, color: "#cbd5e1" },
    { label: "Đủ điều kiện", value: 8, color: "#34d399" },
    { label: "Cần chú ý", value: 6, color: "#fbbf24" },
  ],
  progress: [22, 27, 31, 36, 43, 49, 56, 64, 69, 76, 82],
  progressLabels: ["01/05", "04/05", "08/05", "12/05", "16/05", "20/05", "24/05", "28/05", "01/06", "05/06", "08/06"],
  lecturerLoad: [
    { name: "Trương Long", code: "LEC-014", sessions: 18, quota: 20, color: "#8b5cf6" },
    { name: "Nguyễn Minh Sang", code: "LEC-021", sessions: 16, quota: 20, color: "#38bdf8" },
    { name: "Lâm Hữu Khánh Phương", code: "LEC-009", sessions: 14, quota: 18, color: "#34d399" },
    { name: "Đỗ Tấn Nhàn", code: "LEC-004", sessions: 12, quota: 18, color: "#f59e0b" },
    { name: "Nguyễn Trí Thông", code: "LEC-018", sessions: 10, quota: 16, color: "#fb7185" },
  ],
  stages: [
    { label: "Đã hoàn tất Review 1", value: 24, total: 30, color: "bg-emerald-400" },
    { label: "Đang chờ phản hồi", value: 18, total: 30, color: "bg-sky-400" },
    { label: "Cần xếp Defense 1.1", value: 12, total: 30, color: "bg-violet-400" },
    { label: "Có vấn đề cần xử lý", value: 6, total: 30, color: "bg-amber-400" },
  ],
  upcoming: [
    { date: "12", month: "06", title: "Review 1 · Lô 03", meta: "08:00 — 12 nhóm · 4 phòng", tone: "sky" },
    { date: "15", month: "06", title: "Defense 1.1 · Lô 01", meta: "13:30 — 6 nhóm · 2 phòng", tone: "violet" },
    { date: "18", month: "06", title: "Hạn chốt kết quả Review 1", meta: "Còn 5 ngày · 18 nhóm chưa đủ kết quả", tone: "amber" },
  ],
  attention: [
    { code: "GRP-SU26SE017", title: "Thiếu thành viên theo khuyến nghị", meta: "1 thành viên · đã gắn đề tài", tone: "amber", href: "/manager/groups" },
    { code: "GRP-SU26SE018", title: "Chưa có lịch bảo vệ", meta: "Defense 1.1 · cần phân bổ reviewer", tone: "red", href: "/manager/rounds" },
    { code: "GRP-SU26SE028", title: "Khắc phục đã quá hạn", meta: "Quá hạn 2 ngày · chờ xác nhận", tone: "red", href: "/manager/results" },
  ],
  activity: [
    { time: "10 phút trước", text: "Nguyễn Minh Sang đã xác nhận lời mời Review 1", icon: CheckCircle2, tone: "emerald" },
    { time: "42 phút trước", text: "Đã gắn đề tài SU26SE031 cho GRP-SU26SE031", icon: Layers3, tone: "violet" },
    { time: "1 giờ trước", text: "Phương án xếp lịch v3 đã được tạo", icon: Sparkles, tone: "sky" },
    { time: "2 giờ trước", text: "Lê Thị Hải Hà được gán làm Leader", icon: UserRound, tone: "amber" },
  ],
  heatmap: [3, 5, 4, 8, 6, 9, 7, 10, 8, 12, 9, 14, 11, 13, 15, 12, 8, 10, 14, 16, 13, 15, 17, 18, 15, 12, 9, 7, 5, 4, 6, 8, 11, 13, 10, 7],
};

const containerVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

const toneClasses = {
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
} as const;

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((value, index) => `${(index / (data.length - 1)) * 100},${28 - ((value - min) / Math.max(max - min, 1)) * 22}`).join(" ");
  const lastY = points.split(" ").at(-1)?.split(",")[1] ?? "28";
  return <svg viewBox="0 0 100 32" className="h-10 w-24 overflow-visible" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="100" cy={lastY} r="2.5" fill={color} /></svg>;
}

function MetricCard({ item }: { item: (typeof MOCK.kpis)[number] }) {
  const Icon = item.icon;
  const tone = toneClasses[item.tone as keyof typeof toneClasses];
  const color = item.tone === "violet" ? "#8b5cf6" : item.tone === "sky" ? "#0ea5e9" : item.tone === "amber" ? "#f59e0b" : "#10b981";
  return <motion.div variants={itemVariants} className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span><Sparkline data={item.spark} color={color} /></div><p className="mt-4 text-sm text-muted-foreground">{item.label}</p><div className="mt-1 flex items-end justify-between gap-2"><p className="text-3xl font-semibold tracking-tight tabular-nums">{item.value}</p><span className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="size-3.5" />Tăng</span></div><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></motion.div>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm ${className}`}>{children}</section>;
}

function PanelHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div>{eyebrow && <p className="text-xs font-medium text-muted-foreground normal-case">{eyebrow.toLocaleLowerCase("vi-VN")}</p>}<h2 className="mt-1 text-base font-semibold tracking-tight">{title}</h2></div>{action}</div>;
}
function AreaChart() {
  const width = 720;
  const height = 250;
  const left = 38;
  const right = 12;
  const top = 18;
  const bottom = 32;
  const points = MOCK.progress.map((value, index) => ({ x: left + (index / (MOCK.progress.length - 1)) * (width - left - right), y: top + ((100 - value) / 100) * (height - top - bottom) }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`;
  return <div className="mt-5 min-w-0"><svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full overflow-visible" role="img" aria-label="Biểu đồ tỷ lệ hoàn thành theo thời gian"><defs><linearGradient id="progress-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.26" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient><linearGradient id="progress-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>{[0, 25, 50, 75, 100].map((tick) => { const y = top + ((100 - tick) / 100) * (height - top - bottom); return <g key={tick}><line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" className="text-border/70" strokeDasharray="3 5" /><text x="0" y={y + 4} className="fill-muted-foreground text-[11px]">{tick}%</text></g>; })}<path d={areaPath} fill="url(#progress-fill)" /><path d={linePath} fill="none" stroke="url(#progress-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="var(--card)" stroke="#8b5cf6" strokeWidth="2.5" />)}{MOCK.progressLabels.map((label, index) => <text key={label} x={points[index].x} y={height - 7} textAnchor="middle" className="fill-muted-foreground text-[10px]">{label}</text>)}</svg></div>;
}

function DonutChart() {
  const total = MOCK.projectStatus.reduce((sum, item) => sum + item.value, 0);
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const segments = MOCK.projectStatus.reduce<Array<{ label: string; color: string; length: number; offset: number }>>((result, item) => {
    const length = (item.value / total) * circumference;
    const offset = result.reduce((sum, segment) => sum + segment.length, 0);
    return [...result, { label: item.label, color: item.color, length, offset }];
  }, []);
  return <div className="relative flex size-48 shrink-0 items-center justify-center"><svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label="Phân bổ trạng thái đề tài"><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/70" />{segments.map((segment) => <circle key={segment.label} cx="60" cy="60" r={radius} fill="none" stroke={segment.color} strokeWidth="12" strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={-segment.offset} strokeLinecap="round" />)}</svg><div className="absolute text-center"><p className="text-3xl font-semibold tabular-nums">{total}</p><p className="text-xs text-muted-foreground">đề tài</p></div></div>;
}

function LegendRow({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} /><span className="truncate text-muted-foreground">{label}</span></span><span className="font-medium tabular-nums">{value}</span></div>;
}

function WorkloadChart() {
  const max = 20;
  return <div className="mt-5 space-y-4">{MOCK.lecturerLoad.map((item) => <div key={item.code} className="grid grid-cols-[minmax(126px,0.9fr)_minmax(120px,1.6fr)_48px] items-center gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-[11px] text-muted-foreground">{item.code}</p></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all" style={{ width: `${(item.sessions / max) * 100}%`, backgroundColor: item.color }} /></div><span className="text-right text-xs font-medium tabular-nums">{item.sessions}/{item.quota}</span></div>)}<div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground"><span>Buổi đã phân bổ / hạn mức</span><Link href="/manager/reports" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Xem báo cáo <ChevronRight className="size-3.5" /></Link></div></div>;
}

function Heatmap() {
  return <div className="mt-5"><div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>05/05</span><span>12 tuần vận hành</span><span>08/06</span></div><div className="mt-3 grid grid-cols-12 gap-1.5 sm:grid-cols-[repeat(18,minmax(0,1fr))]">{MOCK.heatmap.map((value, index) => { const level = value >= 16 ? "bg-violet-600" : value >= 12 ? "bg-violet-400" : value >= 8 ? "bg-violet-300" : value >= 4 ? "bg-violet-200" : "bg-muted"; return <span key={index} title={`${value} hoạt động`} className={`aspect-square rounded-[4px] ${level}`} />; })}</div><div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground"><span>Ít</span><span className="size-2.5 rounded-[3px] bg-muted" /><span className="size-2.5 rounded-[3px] bg-violet-200" /><span className="size-2.5 rounded-[3px] bg-violet-400" /><span className="size-2.5 rounded-[3px] bg-violet-600" /><span>Nhiều</span></div></div>;
}

export function ManagerDashboard() {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId, semesters, setCurrentSemesterId } = useSemesterContext();

  if (!currentSemesterId) {
    return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300" aria-hidden><CalendarDays className="size-7" /></span><p className="mt-5 text-base font-semibold">Chưa chọn học kỳ làm việc</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Chọn học kỳ để xem dashboard điều hành và tiến độ đánh giá.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{semesters.length > 0 && <button type="button" onClick={() => setCurrentSemesterId(semesters.find((semester) => semester.status === "ACTIVE")?.code ?? semesters[0].code)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><CalendarDays className="size-4" />Chọn học kỳ</button>}<Link href="/manager/semesters" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Tạo học kỳ</Link></div></div>;
  }

  return <motion.div variants={reduceMotion ? undefined : containerVariants} initial={reduceMotion ? undefined : "hidden"} animate={reduceMotion ? undefined : "show"} className="space-y-6 pb-8">
    <motion.section variants={reduceMotion ? undefined : itemVariants} className="rounded-2xl border border-border/70 bg-card px-6 py-6 shadow-sm sm:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Bảng điều hành</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Tổng quan <span className="font-normal text-muted-foreground">— {currentSemesterId}</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Theo dõi nhanh đề tài, nhóm sinh viên, tiến độ đánh giá và những việc cần xử lý.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Bản xem trước</span>
          <Link href="/manager/rounds" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-3.5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"><CalendarClock className="size-4" />Mở lịch đánh giá</Link>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" />Cập nhật mô phỏng: vừa xong</span>
        <span className="inline-flex items-center gap-1.5"><Target className="size-3.5" />Mục tiêu tuần: hoàn tất 90% xếp lịch</span>
        <Link href="/manager/reports" className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline">Xem báo cáo chi tiết <ChevronRight className="size-3.5" /></Link>
      </div>
    </motion.section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{MOCK.kpis.map((item) => <MetricCard key={item.label} item={item} />)}</div>
    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="TIẾN ĐỘ TOÀN KỲ" title="Tỷ lệ hoàn thành các mốc đánh giá" action={<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300"><TrendingUp className="size-3.5" />+18.4%</span>} /><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-gradient-to-r from-sky-400 to-violet-500" />Hoàn thành lũy kế</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-border" />Mục tiêu 90%</span></div><AreaChart /></Panel><Panel><PanelHeading eyebrow="DANH MỤC ĐỀ TÀI" title="Phân bổ trạng thái" action={<Link href="/manager/projects" className="text-xs font-medium text-primary hover:underline">Xem danh sách</Link>} /><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center xl:flex-col xl:gap-4"><DonutChart /><div className="w-full max-w-[220px] space-y-3">{MOCK.projectStatus.map((item) => <LegendRow key={item.label} {...item} />)}</div></div><div className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Gợi ý:</span> 6 đề tài cần được rà lại trước khi chốt phương án xếp lịch tiếp theo.</div></Panel></div>
    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="DÒNG CHẢY NHÓM" title="Tiến độ theo mốc đánh giá" action={<button type="button" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Tùy chọn biểu đồ"><MoreHorizontal className="size-4" /></button>} /><div className="mt-5 space-y-4">{MOCK.stages.map((stage) => <div key={stage.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-muted-foreground">{stage.label}</span><span className="shrink-0 font-medium tabular-nums">{stage.value}<span className="font-normal text-muted-foreground">/{stage.total}</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(stage.value / stage.total) * 100}%` }} /></div></div>)}</div><div className="mt-6 grid grid-cols-3 gap-2 border-t border-border/70 pt-4 text-center"><div><p className="text-lg font-semibold tabular-nums">24</p><p className="text-[11px] text-muted-foreground">đã hoàn tất</p></div><div><p className="text-lg font-semibold tabular-nums">18</p><p className="text-[11px] text-muted-foreground">đang chờ</p></div><div><p className="text-lg font-semibold text-amber-600 tabular-nums dark:text-amber-300">6</p><p className="text-[11px] text-muted-foreground">cần chú ý</p></div></div></Panel><Panel><PanelHeading eyebrow="PHÂN BỔ TẢI" title="Tải giảng viên theo số phiên" action={<Link href="/manager/reports" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Báo cáo tải <ChevronRight className="size-3.5" /></Link>} /><WorkloadChart /></Panel></div>
    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="NHỊP VẬN HÀNH" title="Hoạt động trong 5 tuần gần nhất" action={<span className="text-xs text-muted-foreground">36 ngày</span>} /><Heatmap /><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Hoạt động/ngày</p><p className="mt-1 text-xl font-semibold tabular-nums">11.2</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Ngày cao nhất</p><p className="mt-1 text-xl font-semibold tabular-nums">18</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Chuỗi hiện tại</p><p className="mt-1 text-xl font-semibold tabular-nums">9 ngày</p></div></div></Panel><Panel><PanelHeading eyebrow="LỊCH SẮP TỚI" title="Các mốc cần chuẩn bị" action={<Link href="/manager/calendar" className="text-xs font-medium text-primary hover:underline">Mở lịch</Link>} /><div className="mt-4 divide-y divide-border/70">{MOCK.upcoming.map((item) => <Link key={item.title} href="/manager/calendar" className="flex items-center gap-4 py-3.5 first:pt-1 transition-colors hover:bg-muted/30"><span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl ${toneClasses[item.tone as keyof typeof toneClasses]}`}><span className="text-lg font-semibold leading-none tabular-nums">{item.date}</span><span className="mt-1 text-[10px] font-medium uppercase">T{item.month}</span></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.meta}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></Link>)}</div></Panel></div>
    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="CẦN XỬ LÝ" title="Tín hiệu cần chú ý" action={<Link href="/manager/groups" className="text-xs font-medium text-primary hover:underline">Xem tất cả</Link>} /><div className="mt-4 divide-y divide-border/70">{MOCK.attention.map((item) => <Link key={item.code} href={item.href} className="group flex items-center gap-3 py-3.5 first:pt-1 transition-colors hover:bg-muted/30"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClasses[item.tone as keyof typeof toneClasses]}`}><CircleAlert className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-mono text-xs font-medium text-muted-foreground">{item.code}</span><span className="mt-0.5 block truncate text-sm font-medium">{item.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.meta}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>)}</div></Panel><Panel><PanelHeading eyebrow="NHẬT KÝ HỆ THỐNG" title="Hoạt động gần đây" action={<button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Xem nhật ký <ChevronRight className="size-3.5" /></button>} /><div className="mt-4 space-y-4">{MOCK.activity.map((item) => { const Icon = item.icon; return <div key={item.time} className="flex gap-3"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[item.tone as keyof typeof toneClasses]}`}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-sm leading-5">{item.text}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p></div></div>; })}</div></Panel></div>
    <Panel className="overflow-hidden bg-gradient-to-br from-violet-500/[0.07] via-card to-sky-500/[0.07]"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Zap className="size-5" /></span><div><p className="text-sm font-semibold">Trung tâm hành động nhanh</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Các shortcut sẽ nối vào dữ liệu thật sau khi chốt mockup dashboard.</p></div></div><div className="flex flex-wrap gap-2"><Link href="/manager/groups" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-background"><Users2 className="size-3.5" />Quản lý nhóm</Link><Link href="/manager/projects" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-background"><FileSpreadsheet className="size-3.5" />Quản lý đề tài</Link><Link href="/manager/committees" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-background"><Award className="size-3.5" />Hội đồng</Link></div></div></Panel>
  </motion.div>;
}
