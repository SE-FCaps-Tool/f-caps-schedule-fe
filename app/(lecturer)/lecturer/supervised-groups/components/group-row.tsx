"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ChevronDown, Crown, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { SupervisedProject } from "@/lib/api/services/fetchLecturerPortal";
import type { ReviewResult, DefenseResult } from "@/lib/api/services/fetchResults";
import {
  ROUND_TYPE_LABEL,
  PROJECT_STATUS_META,
  REVIEW_RESULT_META,
  DEFENSE_RESULT_META,
  REMEDIATION_STATUS_META,
} from "../../_shared/labels";
import { toneBadgeClass, toneDotClass } from "./tone";

export function GroupRow({ project }: { project: SupervisedProject }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const statusMeta = PROJECT_STATUS_META[project.projectStatus];
  const leader = project.group.leader;
  const result = project.latestResult;
  const resultMeta = result
    ? result.kind === "REVIEW"
      ? REVIEW_RESULT_META[result.value as ReviewResult]
      : DEFENSE_RESULT_META[result.value as DefenseResult]
    : null;

  return (
    <div className="border-b border-border first:border-t last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-expanded={expanded}
      >
        <span className={cn("size-2.5 shrink-0 rounded-full", toneDotClass[statusMeta.tone])} aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm font-semibold">{project.group.code}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {project.supervisorRole === "MAIN" ? "GVHD chính" : "Đồng hướng dẫn"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{project.titleVi}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {leader ? (
              <span className="inline-flex items-center gap-1">
                <Crown className="size-3 text-primary" />
                {leader.name}
              </span>
            ) : (
              "Chưa có trưởng nhóm"
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold text-nowrap", toneBadgeClass[statusMeta.tone])}>
            {statusMeta.label}
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pb-4 pl-[1.125rem] text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Đợt tiếp theo</span>
                {project.nextEvaluation ? (
                  <span className="font-medium">
                    {ROUND_TYPE_LABEL[project.nextEvaluation.roundType]}
                    {project.nextEvaluation.date && (
                      <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                        {formatDate(project.nextEvaluation.date, "DD/MM")}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>

              {result && resultMeta && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    Kết quả gần nhất · {ROUND_TYPE_LABEL[result.roundType]}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", toneBadgeClass[resultMeta.tone])}>
                    {resultMeta.label}
                  </span>
                </div>
              )}

              {project.remediation && (
                <div className="rounded-lg bg-amber-50/60 p-3 dark:bg-amber-500/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Hạn khắc phục</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        toneBadgeClass[REMEDIATION_STATUS_META[project.remediation.status].tone]
                      )}
                    >
                      <AlertTriangle className="size-3.5" />
                      {REMEDIATION_STATUS_META[project.remediation.status].label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm tabular-nums">{formatDate(project.remediation.deadline, "dddd, DD/MM/YYYY")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Người xác nhận: {project.remediation.verifierName}</p>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users2 className="size-4" />
                {project.group.memberCount} thành viên
                {leader && (
                  <span className="ml-1 inline-flex items-center gap-1 text-foreground">
                    <Crown className="size-3.5 text-primary" />
                    {leader.name} <span className="text-xs text-muted-foreground">{leader.code}</span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
