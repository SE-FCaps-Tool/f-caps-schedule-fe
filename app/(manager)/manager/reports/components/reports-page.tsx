"use client";

import { useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Download,
  FileBarChart,
  GraduationCap,
  Layers3,
  RefreshCw,
  Target,
  Users2,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DEFENSE_CONCLUSION_META, type DefenseConclusion } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import {
  useDashboard,
  useLecturerLoadReport,
  useOutcomesReport,
  useQualityReport,
  useRemediationReport,
  useExportSchedule,
  useExportResults,
} from "@/hooks/manager/useReports";

const OUTCOME_COLORS = ["#10b981", "#f59e0b", "#fb923c", "#ef4444"];

function notImplemented(action: string) {
  toast.info(`${action} — chưa nối backend`);
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-border/70 bg-card p-5 shadow-sm", className)}>{children}</section>;
}

function PanelHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div>{eyebrow && <p className="text-xs font-medium text-muted-foreground">{eyebrow.toLocaleLowerCase("vi-VN")}</p>}<h2 className="mt-1 text-base font-semibold tracking-tight">{title}</h2></div>{action}</div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone, progress }: { label: string; value: string; detail: string; icon: typeof Layers3; tone: "violet" | "sky" | "amber" | "emerald"; progress?: number }) {
  const toneClass = { violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300", sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300", amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300", emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" }[tone];
  return <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><span className={cn("flex size-10 items-center justify-center rounded-xl", toneClass)}><Icon className="size-5" /></span>{progress !== undefined && <span className="text-sm font-semibold tabular-nums">{progress}%</span>}</div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p>{progress !== undefined && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", tone === "amber" ? "bg-amber-500" : tone === "emerald" ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min(progress, 100)}%` }} /></div>}</div>;
}

function EmptyReport({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">{children}</div>;
}

function OutcomeDonut({ rows }: { rows: { label: string; count: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = rows.reduce<Array<{ label: string; count: number; color: string; length: number; offset: number }>>((result, row) => { const length = total > 0 ? (row.count / total) * circumference : 0; const offset = result.reduce((sum, segment) => sum + segment.length, 0); return [...result, { ...row, length, offset }]; }, []);
  return <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative flex size-44 shrink-0 items-center justify-center"><svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label="Phân bố kết quả đánh giá"><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/70" />{segments.map((segment) => <circle key={segment.label} cx="60" cy="60" r={radius} fill="none" stroke={segment.color} strokeWidth="12" strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={-segment.offset} strokeLinecap="round" />)}</svg><div className="absolute text-center"><p className="text-3xl font-semibold tabular-nums">{total}</p><p className="text-xs text-muted-foreground">kết quả</p></div></div><div className="w-full max-w-[220px] space-y-3">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} /><span className="truncate text-muted-foreground">{row.label}</span></span><span className="font-medium tabular-nums">{row.count}</span></div>)}</div></div>;
}

interface AttentionItem { key: string; groupCode: string; label: string; href: string; tone: "amber" | "red"; }

export function ReportsPage() {
  const { currentSemesterId, currentSemester, semesters, setCurrentSemesterId } = useSemesterContext();
  const { data: dashboard } = useDashboard(currentSemester?.id);
  const { data: lecturerLoad, isLoading: loadLoading, isError: loadError } = useLecturerLoadReport(currentSemester?.id);
  const { data: outcomes, isLoading: outcomesLoading, isError: outcomesError } = useOutcomesReport(currentSemester?.id);
  const { data: quality } = useQualityReport(currentSemester?.id);
  const { data: remediation } = useRemediationReport(currentSemester?.id);
  const exportSchedule = useExportSchedule();
  const exportResults = useExportResults();

  const defenseOutcomes = useMemo(() => (outcomes?.rows ?? []).filter((row) => row.type === "DEFENSE_1_1" || row.type === "REVIEW_3"), [outcomes]);
  const outcomeRows = useMemo(() => defenseOutcomes.map((row, index) => ({ label: DEFENSE_CONCLUSION_META[row.outcome as DefenseConclusion]?.label ?? row.outcome, count: row.count, color: OUTCOME_COLORS[index % OUTCOME_COLORS.length] })), [defenseOutcomes]);
  const defenseTotal = outcomeRows.reduce((sum, row) => sum + row.count, 0);
  const qualityRows = quality?.rows ?? [];
  const noLeaderCount = qualityRows.filter((row) => row.leaders !== 1).length;
  const underFourCount = qualityRows.filter((row) => row.activeMembers < 4).length;
  const healthyCount = qualityRows.filter((row) => row.leaders === 1 && row.activeMembers >= 4).length;
  const overdueCount = remediation?.rows.filter((row) => row.status === "OVERDUE").length ?? 0;
  const openRemediationCount = remediation?.rows.filter((row) => row.status === "OPEN").length ?? 0;
  const responseRate = dashboard?.availability.invited ? Math.round((dashboard.availability.responded / dashboard.availability.invited) * 100) : 0;
  const scheduleRate = dashboard?.groups.total ? Math.round((dashboard.groups.scheduled / dashboard.groups.total) * 100) : 0;
  const overloadedLecturers = lecturerLoad?.rows.filter((row) => row.quotaPercent >= 90).length ?? 0;

  const attentionItems: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];
    for (const row of quality?.rows ?? []) {
      if (row.leaders !== 1) items.push({ key: `${row.id}-leader`, groupCode: row.code, label: "Chưa có Leader", href: "/manager/groups", tone: "amber" });
      if (row.activeMembers < 4) items.push({ key: `${row.id}-members`, groupCode: row.code, label: "Dưới 4 thành viên", href: "/manager/groups", tone: "amber" });
    }
    for (const row of remediation?.rows ?? []) if (row.status === "OVERDUE") items.push({ key: `${row.id}-overdue`, groupCode: row.groupCode, label: "Khắc phục quá hạn", href: "/manager/results", tone: "red" });
    return items.slice(0, 6);
  }, [quality, remediation]);

  if (!currentSemesterId) return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><FileBarChart className="size-7" /></span><p className="mt-5 text-base font-semibold">Chưa chọn học kỳ làm việc</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Chọn học kỳ để xem báo cáo vận hành và xuất dữ liệu.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{semesters.length > 0 && <button type="button" onClick={() => setCurrentSemesterId(semesters.find((semester) => semester.status === "ACTIVE")?.code ?? semesters[0].code)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><CalendarDays className="size-4" />Chọn học kỳ</button>}<Link href="/manager/semesters" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Tạo học kỳ</Link></div></div>;

  return <div className="space-y-6 pb-8">
    <section className="rounded-2xl border border-border/70 bg-card px-6 py-6 shadow-sm sm:px-8"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="text-sm font-medium text-muted-foreground">Báo cáo vận hành</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Báo cáo <span className="font-normal text-muted-foreground">— {currentSemesterId}</span></h1><p className="mt-2 text-sm text-muted-foreground">Tổng hợp tải, tiến độ, chất lượng nhóm và kết quả đánh giá trong học kỳ.</p></div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Dữ liệu cập nhật</span><Link href="/manager/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium hover:bg-muted"><BarChart3 className="size-4" />Về tổng quan</Link></div></div><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" />Phạm vi: học kỳ {currentSemesterId}</span><span className="inline-flex items-center gap-1.5"><Target className="size-3.5" />Dùng để chốt quyết định vận hành</span></div></section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Nhóm đã xếp lịch" value={dashboard ? `${dashboard.groups.scheduled}/${dashboard.groups.total}` : "—"} detail={dashboard ? `${dashboard.groups.unscheduled} nhóm chưa xếp` : "Đang tải dữ liệu"} icon={CalendarCheck2} tone="emerald" progress={dashboard ? scheduleRate : undefined} /><MetricCard label="Phản hồi giảng viên" value={dashboard ? `${dashboard.availability.responded}/${dashboard.availability.invited}` : "—"} detail={dashboard ? "Đã phản hồi lời mời" : "Đang tải dữ liệu"} icon={GraduationCap} tone="sky" progress={dashboard ? responseRate : undefined} /><MetricCard label="Giảng viên cần cân tải" value={lecturerLoad ? String(overloadedLecturers) : "—"} detail={lecturerLoad ? "Đang ở mức sử dụng từ 90%" : "Đang tải dữ liệu"} icon={Users2} tone="amber" /><MetricCard label="Case khắc phục" value={remediation ? String(remediation.rows.length) : "—"} detail={remediation ? `${overdueCount} quá hạn · ${openRemediationCount} đang chờ` : "Đang tải dữ liệu"} icon={RefreshCw} tone="violet" /></div>

    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="Tải giảng viên" title="Phân bổ số phiên theo người" action={<Link href="/manager/lecturers" className="text-xs font-medium text-primary hover:underline">Danh sách GV <ChevronRight className="inline size-3.5" /></Link>} /><div className="mt-5">{loadLoading && <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>}{loadError && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><WifiOff className="size-4" />Không tải được báo cáo tải giảng viên.</div>}{!loadLoading && !loadError && lecturerLoad?.rows.length === 0 && <EmptyReport>Chưa có dữ liệu tải giảng viên.</EmptyReport>}{!loadLoading && !loadError && lecturerLoad && lecturerLoad.rows.length > 0 && <div className="space-y-4">{lecturerLoad.rows.slice(0, 6).map((row) => { const isOver = row.quotaPercent >= 90; return <div key={row.lecturerId} className="grid grid-cols-[minmax(135px,0.9fr)_minmax(120px,1.6fr)_48px] items-center gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.displayName}</p><p className="text-[11px] text-muted-foreground">{row.lecturerCode}</p></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", isOver ? "bg-amber-500" : "bg-primary")} style={{ width: `${Math.min(row.quotaPercent, 100)}%` }} /></div><span className={cn("text-right text-xs tabular-nums", isOver && "font-medium text-amber-600 dark:text-amber-300")}>{row.sessionCount}/{row.quota}</span></div>; })}</div>}</div><div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground"><span>Buổi đã phân bổ / hạn mức</span><Link href="/manager/reports" className="font-medium text-primary hover:underline">Đang xem toàn bộ</Link></div></Panel><Panel><PanelHeading eyebrow="Kết quả đánh giá" title="Phân bố kết quả Defense 1.1" action={<span className="text-xs text-muted-foreground">{defenseTotal} kết quả</span>} /><div className="mt-5">{outcomesLoading && <Skeleton className="h-44 w-full" />}{outcomesError && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><WifiOff className="size-4" />Không tải được phân bố kết quả.</div>}{!outcomesLoading && !outcomesError && outcomeRows.length === 0 && <EmptyReport>Chưa có kết quả Defense 1.1 trong học kỳ này.</EmptyReport>}{!outcomesLoading && !outcomesError && outcomeRows.length > 0 && <OutcomeDonut rows={outcomeRows} />}</div>{outcomeRows.length > 0 && <div className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Tổng quan:</span> dữ liệu hiện có {defenseTotal} kết quả, dùng để theo dõi chất lượng đầu ra theo từng đợt.</div>}</Panel></div>

    <div className="grid gap-6 xl:grid-cols-2"><Panel><PanelHeading eyebrow="Sức khỏe nhóm" title="Các chỉ số chất lượng hiện tại" action={<Link href="/manager/groups" className="text-xs font-medium text-primary hover:underline">Mở quản lý nhóm <ChevronRight className="inline size-3.5" /></Link>} /><div className="mt-5 space-y-4">{[{ label: "Nhóm đủ điều kiện cơ bản", value: healthyCount, color: "bg-emerald-500" }, { label: "Nhóm chưa có Leader", value: noLeaderCount, color: "bg-amber-500" }, { label: "Nhóm dưới 4 thành viên", value: underFourCount, color: "bg-orange-500" }].map((item) => { const total = Math.max(qualityRows.length, 1); return <div key={item.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{item.label}</span><span className="font-medium tabular-nums">{item.value}<span className="font-normal text-muted-foreground">/{qualityRows.length || "—"}</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", item.color)} style={{ width: `${Math.min((item.value / total) * 100, 100)}%` }} /></div></div>; })}</div><div className="mt-6 grid grid-cols-3 gap-2 border-t border-border/70 pt-4 text-center"><div><p className="text-lg font-semibold tabular-nums">{qualityRows.length || "—"}</p><p className="text-[11px] text-muted-foreground">tổng nhóm</p></div><div><p className="text-lg font-semibold text-amber-600 tabular-nums dark:text-amber-300">{noLeaderCount || "—"}</p><p className="text-[11px] text-muted-foreground">thiếu Leader</p></div><div><p className="text-lg font-semibold text-orange-600 tabular-nums dark:text-orange-300">{underFourCount || "—"}</p><p className="text-[11px] text-muted-foreground">dưới 4 SV</p></div></div></Panel><Panel><PanelHeading eyebrow="Khắc phục" title="Tình trạng remediation" action={<Link href="/manager/results" className="text-xs font-medium text-primary hover:underline">Mở kết quả <ChevronRight className="inline size-3.5" /></Link>} /><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Tổng case</p><p className="mt-1 text-2xl font-semibold tabular-nums">{remediation ? remediation.rows.length : "—"}</p></div><div className="rounded-xl bg-amber-500/10 p-4"><p className="text-xs text-amber-700 dark:text-amber-300">Đang chờ</p><p className="mt-1 text-2xl font-semibold text-amber-700 tabular-nums dark:text-amber-300">{remediation ? openRemediationCount : "—"}</p></div><div className="rounded-xl bg-rose-500/10 p-4"><p className="text-xs text-rose-700 dark:text-rose-300">Quá hạn</p><p className="mt-1 text-2xl font-semibold text-rose-700 tabular-nums dark:text-rose-300">{remediation ? overdueCount : "—"}</p></div></div><div className="mt-5 space-y-3">{remediation?.rows.slice(0, 4).map((row) => <Link key={row.id} href="/manager/results" className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition-colors hover:bg-muted/40"><span className={cn("size-2.5 shrink-0 rounded-full", row.status === "OVERDUE" ? "bg-rose-500" : row.status === "OPEN" ? "bg-amber-500" : "bg-emerald-500")} /><span className="min-w-0 flex-1"><span className="block truncate font-mono text-xs font-medium">{row.groupCode}</span><span className="mt-0.5 block text-xs text-muted-foreground">{row.status === "OVERDUE" ? "Đã quá hạn xử lý" : row.status === "OPEN" ? "Đang chờ xác nhận" : "Đã hoàn tất"}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></Link>)}{remediation && remediation.rows.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">Không có case remediation.</p>}</div></Panel></div>

    <Panel><PanelHeading eyebrow="Điểm cần chú ý" title="Các nhóm cần được rà soát" action={<Link href="/manager/groups" className="text-xs font-medium text-primary hover:underline">Xem tất cả <ChevronRight className="inline size-3.5" /></Link>} /><div className="mt-4 divide-y divide-border/70">{attentionItems.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Không có nhóm nào cần chú ý.</p>}{attentionItems.map((item) => <Link key={item.key} href={item.href} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", item.tone === "red" ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300")}><CircleAlert className="size-4" /></span><span className="min-w-0 flex-1"><span className="block font-mono text-xs font-medium text-muted-foreground">{item.groupCode}</span><span className="mt-0.5 block text-sm font-medium">{item.label}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>)}</div></Panel>

    <Panel className="bg-muted/20"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">Xuất dữ liệu báo cáo</p><p className="mt-1 text-xs text-muted-foreground">Tải các file phục vụ họp bộ môn hoặc lưu trữ học kỳ.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!currentSemester?.id || exportSchedule.isPending} onClick={() => currentSemester?.id && exportSchedule.mutate(currentSemester.id)}><Download />{exportSchedule.isPending ? "Đang xuất..." : "Xuất lịch đánh giá"}</Button><Button variant="outline" size="sm" disabled={!currentSemester?.id || exportResults.isPending} onClick={() => currentSemester?.id && exportResults.mutate(currentSemester.id)}><Download />{exportResults.isPending ? "Đang xuất..." : "Xuất kết quả"}</Button><Button variant="outline" size="sm" onClick={() => notImplemented("Xuất workload")}><Download />Xuất workload</Button><Button variant="outline" size="sm" onClick={() => notImplemented("Xuất báo cáo học kỳ")}><Download />Xuất báo cáo học kỳ</Button></div></div></Panel>
  </div>;
}
