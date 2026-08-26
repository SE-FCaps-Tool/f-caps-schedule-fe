"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  FilePlus2,
  Pencil,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { AuditEntryApi } from "@/lib/api/services/fetchAudit";
import { actionLabel } from "./action-labels";

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

type ActionTone = "violet" | "sky" | "amber" | "rose";

function actionMeta(action: string): { icon: LucideIcon; tone: ActionTone; label: string } {
  if (/DELETE|REMOVE|LOCK|UNLOCK/.test(action)) return { icon: CircleAlert, tone: "rose", label: actionLabel(action) };
  if (/CREATE|PUBLISH/.test(action)) return { icon: FilePlus2, tone: "sky", label: actionLabel(action) };
  if (/ROLE|ASSIGN|STATUS/.test(action)) return { icon: UserRoundCog, tone: "amber", label: actionLabel(action) };
  if (/ROUND|SESSION|SCHEDULE/.test(action)) return { icon: CalendarDays, tone: "violet", label: actionLabel(action) };
  return { icon: Pencil, tone: "violet", label: actionLabel(action) };
}

const toneClasses: Record<ActionTone, { icon: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  violet: { icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300", badge: "secondary" },
  sky: { icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300", badge: "outline" },
  amber: { icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300", badge: "secondary" },
  rose: { icon: "bg-rose-500/10 text-rose-600 dark:text-rose-300", badge: "destructive" },
};

function readableEntity(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType.toLowerCase().replaceAll("_", " ");
}

function readableValue(value: unknown) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DiffFields({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));

  if (keys.length === 0) return <p className="text-xs text-muted-foreground">Không có thay đổi dữ liệu chi tiết.</p>;

  return (
    <div className="space-y-2.5">
      {keys.map((key) => {
        const beforeValue = before?.[key];
        const afterValue = after?.[key];
        const changed = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
        return (
          <div key={key} className="grid gap-1 text-xs sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3">
            <span className="font-mono text-muted-foreground">{key}</span>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono">
              <span className={cn("break-all", changed && "text-muted-foreground line-through decoration-muted-foreground/50")}>{readableValue(beforeValue)}</span>
              {changed && <><ArrowRight className="size-3 shrink-0 text-muted-foreground/60" /><span className="break-all font-medium text-foreground">{readableValue(afterValue)}</span></>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AuditEntryRow({ entry, actorName }: { entry: AuditEntryApi; actorName: string }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const meta = actionMeta(entry.action);
  const Icon = meta.icon;
  const colors = toneClasses[meta.tone];
  const detailsId = `audit-entry-${entry.id}`;

  return (
    <article className="group py-1">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:gap-4 sm:px-3"
        aria-expanded={expanded}
        aria-controls={detailsId}
      >
        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${colors.icon}`} aria-hidden><Icon className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{actorName}</span>
            <Badge variant={colors.badge}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">{readableEntity(entry.entityType)} #{entry.entityId}</span>
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{entry.reason || "Không có lý do được ghi nhận"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 pt-1">
          <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{formatDate(entry.occurredAt, "DD/MM/YYYY HH:mm")}</span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={detailsId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-12 space-y-4 rounded-xl bg-muted/45 px-4 py-4 sm:ml-16">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Actor: {actorName}</span><span>Thời gian: {formatDate(entry.occurredAt, "DD/MM/YYYY HH:mm:ss")}</span><span>Entity: {entry.entityType}</span></div>
              <p className="text-sm leading-6 text-foreground">{entry.reason || "Không có lý do được ghi nhận."}</p>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3"><p className="mb-3 text-xs font-medium text-muted-foreground">Chi tiết thay đổi</p><DiffFields before={entry.beforeJson} after={entry.afterJson} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
