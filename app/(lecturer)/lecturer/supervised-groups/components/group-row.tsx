"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, CheckCircle2, ChevronDown, Crown, Hourglass, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { DEFENSE_LEVELS, JOURNEY_STATUS_META, type SupervisedGroup } from "./mock-data";
import { toneBadgeClass, toneDotClass } from "./tone";
import { RoundProgress, roundTone } from "./round-progress";
import { AssignLeaderPopover } from "./assign-leader-popover";

const REMEDIATION_STATUS_META = {
  pending: { label: "Chờ xác nhận", icon: Hourglass, className: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
  passed: { label: "Đạt", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  overdue: { label: "Quá hạn", icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
};

export function GroupRow({
  group,
  onAssignLeader,
}: {
  group: SupervisedGroup;
  onAssignLeader: (memberId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const statusMeta = JOURNEY_STATUS_META[group.currentStatus];
  const leader = group.members.find((m) => m.isLeader);

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
            <span className="font-mono text-sm font-semibold">{group.code}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {group.myRole === "MAIN" ? "GVHD chính" : "Đồng hướng dẫn"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{group.titleVi}</p>
          <div className="mt-2 flex items-center gap-3">
            <RoundProgress rounds={group.rounds} />
            <span className="text-xs text-muted-foreground">
              {leader ? (
                <span className="inline-flex items-center gap-1">
                  <Crown className="size-3 text-primary" />
                  {leader.fullName}
                </span>
              ) : (
                "Chưa có trưởng nhóm"
              )}
            </span>
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
            <div className="space-y-4 pb-4 pl-[1.125rem]">
              <div className="space-y-2">
                {group.rounds.map((round) => {
                  const tone = roundTone(round);
                  const defenseMeta = round.defenseLevel ? DEFENSE_LEVELS[round.defenseLevel] : undefined;
                  return (
                    <div key={round.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={cn(
                          "size-2 shrink-0",
                          round.kind === "defense" ? "rotate-45" : "rounded-full",
                          round.phaseStatus === "completed" && toneDotClass[tone],
                          round.phaseStatus === "upcoming" && "bg-primary/40 ring-1 ring-primary",
                          round.phaseStatus === "locked" && "bg-border"
                        )}
                        aria-hidden
                      />
                      <span className="w-24 shrink-0 font-medium">{round.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {round.date ? formatDate(round.date, "DD/MM/YYYY") : "—"}
                      </span>
                      {round.phaseStatus === "completed" && round.kind === "review" && round.reviewOutcome && (
                        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-semibold", toneBadgeClass[tone])}>
                          {round.reviewOutcome}
                        </span>
                      )}
                      {round.phaseStatus === "completed" && defenseMeta && (
                        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-semibold", toneBadgeClass[defenseMeta.tone])}>
                          {defenseMeta.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {group.remediation && (
                <div className="rounded-lg bg-amber-50/60 p-3 dark:bg-amber-500/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Hạn khắc phục Defense 1.1</p>
                    {(() => {
                      const meta = REMEDIATION_STATUS_META[group.remediation.status];
                      const Icon = meta.icon;
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.className)}>
                          <Icon className="size-3.5" />
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="mt-1.5 text-sm tabular-nums">{formatDate(group.remediation.dueDate, "dddd, DD/MM/YYYY")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Người xác nhận: {group.remediation.verifier.name} · {group.remediation.verifier.code}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users2 className="size-4" />
                  {group.members.length}/{group.maxMembers} thành viên
                </span>
                {leader ? (
                  <span className="flex items-center gap-1.5">
                    <Crown className="size-3.5 text-primary" />
                    <span className="font-medium">{leader.fullName}</span>
                    <span className="text-xs text-muted-foreground">{leader.studentCode}</span>
                  </span>
                ) : (
                  <AssignLeaderPopover members={group.members} onAssign={onAssignLeader} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
