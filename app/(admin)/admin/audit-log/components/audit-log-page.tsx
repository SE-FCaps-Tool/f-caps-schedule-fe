"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  FileClock,
  Filter,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Users2,
  WifiOff,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/admin/useAccounts";
import { useAudit } from "@/hooks/admin/useAudit";
import { AuditEntryRow } from "./audit-entry-row";
import { actionLabel, KNOWN_ACTIONS } from "./action-labels";

const ENTITY_LABELS: Record<string, string> = {
  ACCOUNT: "Tài khoản",
  SEMESTER: "Học kỳ",
  ROOM: "Phòng",
  LECTURER: "Giảng viên",
  COMMITTEE: "Hội đồng",
  ROUND: "Đợt đánh giá",
  SESSION: "Phiên bảo vệ",
  GROUP: "Nhóm",
  PROJECT: "Đề tài",
};

const MOCK_SIGNALS = [
  { label: "Sự kiện có lý do", value: 98, detail: "Mục tiêu kiểm soát: 95%", color: "bg-emerald-500" },
  { label: "Thao tác được phân loại", value: 94, detail: "Action đã được chuẩn hóa", color: "bg-violet-500" },
  { label: "Tài khoản hoạt động", value: 86, detail: "Trong tổng số tài khoản mẫu", color: "bg-sky-500" },
];

const MOCK_RULES = [
  "Mọi thay đổi dữ liệu quan trọng đều phải có lý do.",
  "Sự kiện không thể xóa khỏi nhật ký hệ thống.",
  "Chỉ ADMIN mới có quyền xem toàn bộ audit log.",
];

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
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

function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: "violet" | "sky" | "emerald" | "amber" }) {
  const toneClass = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <span className={`flex size-9 items-center justify-center rounded-xl ${toneClass}`}><Icon className="size-4.5" /></span>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function entityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType.toLowerCase().replaceAll("_", " ");
}

export function AuditLogPage() {
  const [actorId, setActorId] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [entityType, setEntityType] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data: accounts } = useAccounts();
  const { data: entries, isLoading, isError, refetch, isFetching } = useAudit({
    actorId: actorId !== "ALL" ? Number(actorId) : undefined,
    action: action !== "ALL" ? action : undefined,
    entityType: entityType !== "ALL" ? entityType : undefined,
    limit: 100,
  });

  const accountsById = useMemo(() => new Map((accounts ?? []).map((account) => [account.id, account])), [accounts]);
  const actionsInData = useMemo(() => Array.from(new Set([...KNOWN_ACTIONS, ...(entries ?? []).map((entry) => entry.action)])).sort(), [entries]);
  const entitiesInData = useMemo(() => Array.from(new Set((entries ?? []).map((entry) => entry.entityType))).sort(), [entries]);
  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries ?? [];
    return (entries ?? []).filter((entry) => {
      const actor = accountsById.get(entry.actorId)?.displayName ?? `Tài khoản #${entry.actorId}`;
      return [actor, entry.action, actionLabel(entry.action), entry.entityType, entry.entityId, entry.reason].some((value) => value.toLowerCase().includes(query));
    });
  }, [accountsById, entries, search]);

  const actorCount = new Set(visibleEntries.map((entry) => entry.actorId)).size;
  const entityCount = new Set(visibleEntries.map((entry) => `${entry.entityType}:${entry.entityId}`)).size;
  const updateCount = visibleEntries.filter((entry) => /CREATE|EDIT|UPDATE|CHANGE|ASSIGN|REMOVE|DELETE|PUBLISH|TRANSITION/.test(entry.action)).length;
  const hasFilters = Boolean(search || actorId !== "ALL" || action !== "ALL" || entityType !== "ALL");

  const resetFilters = () => {
    setSearch("");
    setActorId("ALL");
    setAction("ALL");
    setEntityType("ALL");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-card px-5 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground">kiểm soát thay đổi</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Nhật ký hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Theo dõi ai đã thay đổi dữ liệu, thay đổi nào đã xảy ra và lý do được ghi nhận.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-emerald-500" />Chỉ ADMIN được xem</span>
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />Làm mới</Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><FileClock className="size-3.5" />Hiển thị tối đa 100 sự kiện gần nhất</span>
          <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Múi giờ: Asia/Ho_Chi_Minh</span>
          <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" />Tự động cập nhật khi có thay đổi</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sự kiện đang xem" value={String(visibleEntries.length || (isLoading ? "—" : 0))} detail={hasFilters ? "Sau khi áp dụng bộ lọc" : "Trong 100 sự kiện gần nhất"} icon={Activity} tone="violet" />
        <StatCard label="Người thực hiện" value={String(actorCount || (isLoading ? "—" : 0))} detail="Tài khoản đã tạo thao tác" icon={Users2} tone="sky" />
        <StatCard label="Đối tượng thay đổi" value={String(entityCount || (isLoading ? "—" : 0))} detail="Entity và mã bản ghi khác nhau" icon={ListFilter} tone="emerald" />
        <StatCard label="Thao tác cập nhật" value={String(updateCount || (isLoading ? "—" : 0))} detail="Tạo, sửa, gán hoặc chuyển trạng thái" icon={AlertCircle} tone="amber" />
      </div>

      <Panel>
        <PanelHeading eyebrow="Bộ lọc nhật ký" title="Tìm đúng sự kiện cần kiểm tra" action={hasFilters ? <Button variant="ghost" size="xs" onClick={resetFilters}><X className="size-3.5" />Xóa bộ lọc</Button> : <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="size-3.5" />Lọc theo thời gian thực</span>} />
        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(240px,1.4fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
          <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm actor, mã bản ghi, lý do..." className="pl-9" /></div>
          <Select value={actorId} onValueChange={(value) => setActorId(value ?? "ALL")}><SelectTrigger className="w-full"><SelectValue placeholder="Người thực hiện">{(value: string) => value === "ALL" ? "Tất cả người thực hiện" : accountsById.get(Number(value))?.displayName ?? value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả người thực hiện</SelectItem>{(accounts ?? []).map((account) => <SelectItem key={account.id} value={String(account.id)}>{account.displayName}</SelectItem>)}</SelectContent></Select>
          <Select value={action} onValueChange={(value) => setAction(value ?? "ALL")}><SelectTrigger className="w-full"><SelectValue placeholder="Loại hành động">{(value: string) => value === "ALL" ? "Tất cả hành động" : actionLabel(value)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả hành động</SelectItem>{actionsInData.map((item) => <SelectItem key={item} value={item}>{actionLabel(item)}</SelectItem>)}</SelectContent></Select>
          <Select value={entityType} onValueChange={(value) => setEntityType(value ?? "ALL")}><SelectTrigger className="w-full"><SelectValue placeholder="Đối tượng">{(value: string) => value === "ALL" ? "Tất cả đối tượng" : entityLabel(value)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả đối tượng</SelectItem>{entitiesInData.map((item) => <SelectItem key={item} value={item}>{entityLabel(item)}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{visibleEntries.length} kết quả hiển thị</span>{hasFilters && <Badge variant="secondary">Đang lọc</Badge>}{search && <Badge variant="outline">Từ khóa: {search}</Badge>}</div>
      </Panel>

      <Panel className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-5 sm:px-6"><div><p className="text-xs font-medium text-muted-foreground">dòng thời gian</p><h2 className="mt-1 text-base font-semibold tracking-tight">Chi tiết hoạt động</h2></div><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"><CircleUserRound className="size-3.5" />{visibleEntries.length} sự kiện</span></div>
        <div className="px-5 sm:px-6">
          {isLoading && <div className="space-y-3 py-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
          {isError && <div className="flex items-center gap-2 py-14 text-sm text-muted-foreground"><WifiOff className="size-4 shrink-0" />Không tải được audit log. Thử làm mới trang.</div>}
          {!isLoading && !isError && visibleEntries.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-center"><span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Search className="size-5" /></span><p className="mt-4 text-sm font-medium">Không có sự kiện phù hợp</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">Thử đổi bộ lọc hoặc từ khóa để xem thêm nhật ký hệ thống.</p>{hasFilters && <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Xóa bộ lọc</Button>}</div>}
          {!isLoading && !isError && visibleEntries.length > 0 && <div className="divide-y divide-border/70">{visibleEntries.map((entry) => <AuditEntryRow key={entry.id} entry={entry} actorName={entry.actorId == null ? "Hệ thống" : accountsById.get(entry.actorId)?.displayName ?? `Tài khoản #${entry.actorId}`} />)}</div>}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeading eyebrow="Tín hiệu kiểm soát" title="Chất lượng dữ liệu audit" action={<span className="text-xs text-muted-foreground">Mockup data</span>} />
          <div className="mt-5 space-y-5">{MOCK_SIGNALS.map((signal) => <div key={signal.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{signal.label}</span><span className="font-semibold tabular-nums">{signal.value}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${signal.color}`} style={{ width: `${signal.value}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{signal.detail}</p></div>)}</div>
        </Panel>
        <Panel>
          <PanelHeading eyebrow="Nguyên tắc" title="Audit log dùng để làm gì?" />
          <div className="mt-4 space-y-3">{MOCK_RULES.map((rule) => <div key={rule} className="flex items-start gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /><span className="leading-5 text-muted-foreground">{rule}</span></div>)}</div>
          <button type="button" onClick={() => toast.info("Tài liệu audit policy đang ở chế độ mockup")} className="mt-5 text-xs font-medium text-primary hover:underline">Xem audit policy</button>
        </Panel>
      </div>
    </div>
  );
}
