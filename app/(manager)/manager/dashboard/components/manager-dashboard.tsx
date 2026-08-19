"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { CalendarRange, CalendarPlus, ChevronRight, UserX, ClockAlert, CalendarX2, RefreshCcw, UserRoundX, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_STATUS_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useRounds } from "@/hooks/manager/useRounds";
import { useProjects } from "@/hooks/manager/useProjects";
import { useGroups } from "@/hooks/manager/useGroups";
import { useDashboard } from "@/hooks/manager/useReports";
import { useRemediationCases } from "@/hooks/manager/useResults";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

function ProgressBar({ value, total, tone = "primary" }: { value: number; total: number; tone?: "primary" | "emerald" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={tone === "emerald" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary"}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ManagerDashboard() {
  const reduceMotion = useReducedMotion();
  const { currentSemesterId, currentSemester, setCurrentSemesterId, semesters } = useSemesterContext();

  const { data: rounds } = useRounds(currentSemester?.id);
  const { data: projects } = useProjects(currentSemester?.id);
  const { data: groups } = useGroups(currentSemester?.id);
  const { data: remediationCases } = useRemediationCases();

  const { data, isLoading, isError } = useDashboard(currentSemester?.id);

  const currentRound = useMemo(() => {
    if (!rounds || rounds.length === 0) return null;
    return rounds.find((r) => r.id === data?.version?.round_id) ?? rounds[0];
  }, [rounds, data]);

  const overdueRemediationCount = remediationCases?.filter((c) => c.status === "OVERDUE").length ?? 0;

  const inboxItems = data
    ? [
        {
          key: "changeRequests",
          count: data.pending_reschedule_requests,
          label: "yêu cầu thay đổi lịch",
          description: "Đang chờ duyệt trên Lịch đánh giá.",
          icon: RefreshCcw,
          href: "/manager/calendar",
        },
        {
          key: "reviewerAbsent",
          count: data.pending_replacements ?? 0,
          label: "phiên có sự cố giảng viên",
          description: "Cần thay reviewer hoặc hoãn buổi bảo vệ.",
          icon: UserRoundX,
          href: "/manager/calendar",
        },
        {
          key: "unscheduled",
          count: data.groups.unscheduled,
          label: "nhóm chưa xếp được lịch",
          description: "Kiểm tra ràng buộc reviewer/timeslot còn thiếu.",
          icon: CalendarX2,
          href: "/manager/rounds",
        },
        {
          key: "remediationOverdue",
          count: overdueRemediationCount,
          label: "khắc phục quá hạn",
          description: "Cần xem xét và đóng remediation.",
          icon: ClockAlert,
          href: "/manager/results",
        },
        {
          key: "attentionGroups",
          count: data.attention_groups.length,
          label: "nhóm cần chú ý",
          description: "D1.2 có điều kiện, không đạt, hoặc đã rời khỏi kỳ.",
          icon: UserX,
          href: "/manager/groups",
        },
      ].filter((item) => item.count > 0)
    : [];

  if (!currentSemesterId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center motion-reduce:animate-none animate-in fade-in duration-500">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
          <CalendarRange className="size-6" />
        </span>
        <p className="mt-4 text-base font-medium">Chưa chọn học kỳ làm việc</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Chọn một học kỳ để bắt đầu quản lý đề tài, nhóm, đợt đánh giá và lịch của học kỳ đó.
        </p>
        <div className="mt-5 flex items-center gap-2">
          {semesters.length > 0 && (
            <button
              type="button"
              onClick={() => setCurrentSemesterId(semesters.find((s) => s.status === "ACTIVE")?.code ?? semesters[0].code)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CalendarRange className="size-4" />
              Chọn học kỳ
            </button>
          )}
          <Link
            href="/manager/semesters"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <CalendarPlus className="size-4" />
            Tạo học kỳ
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <WifiOff className="size-4 shrink-0" />
        Không tải được dashboard. Thử tải lại trang.
      </div>
    );
  }

  const roundStatus = currentRound ? ROUND_STATUS_META[currentRound.status] : null;

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-foreground">Học kỳ {currentSemesterId}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{projects ? `${projects.length} đề tài` : "…"}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{groups ? `${groups.length} nhóm` : "…"}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Link
          href="/manager/rounds"
          className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Đợt đánh giá hiện tại</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight">
            {currentRound ? `${ROUND_TYPE_LABEL[currentRound.type]} — ${currentSemesterId}` : "Chưa có đợt nào"}
          </p>
          {roundStatus && <StatusDot tone={roundStatus.tone} label={roundStatus.label} className="mt-1" />}

          <div className="mt-4 space-y-3 border-t border-border pt-3">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Giảng viên đã phản hồi lời mời</span>
                <span className="tabular-nums">
                  {data.availability.responded}/{data.availability.invited}
                </span>
              </div>
              <ProgressBar value={data.availability.responded} total={data.availability.invited} />
            </div>
          </div>
        </Link>

        <Link
          href="/manager/calendar"
          className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiến độ xếp lịch</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight tabular-nums">
            {data.groups.scheduled}/{data.groups.total} nhóm
          </p>
          <p className="text-sm text-muted-foreground">{data.groups.unscheduled} nhóm chưa xếp được</p>
          <ProgressBar value={data.groups.scheduled} total={data.groups.total} tone="emerald" />
        </Link>
      </div>

      {inboxItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Việc cần xử lý</h2>
          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="mt-3"
          >
            {inboxItems.map((item) => (
              <motion.div
                key={item.key}
                variants={reduceMotion ? undefined : itemVariants}
                className="border-b border-border first:border-t last:border-b-0"
              >
                <Link href={item.href} className="flex items-center gap-3 py-3.5 transition-colors hover:bg-muted/40">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
                    <item.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {item.count} {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
