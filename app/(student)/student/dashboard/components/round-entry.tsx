"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Clock3, DoorOpen, Info, ShieldCheck, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { DEFENSE_LEVELS, type RoundResult } from "./mock-data";
import { toneBadgeClass, toneDotClass } from "./tone";
import { RemediationStatus } from "./remediation-status";

function reviewOutcomeTone(outcome: RoundResult["reviewOutcome"]) {
  if (outcome === "Không đạt") return "red" as const;
  if (outcome === "Cần sửa") return "amber" as const;
  return "emerald" as const;
}

export function RoundEntry({ round, defaultExpanded = false }: { round: RoundResult; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const reduceMotion = useReducedMotion();

  const defenseMeta = round.defenseLevel ? DEFENSE_LEVELS[round.defenseLevel] : undefined;
  const hasBody = Boolean(
    round.note || round.resultOwner || round.remediation || round.lockedReason || round.session || round.kind === "review"
  );

  const nodeTone =
    round.phaseStatus === "completed"
      ? round.kind === "review"
        ? reviewOutcomeTone(round.reviewOutcome)
        : (defenseMeta?.tone ?? "neutral")
      : "neutral";

  return (
    <div className="border-b border-border first:border-t last:border-b-0">
      <button
        type="button"
        onClick={() => hasBody && setExpanded((value) => !value)}
        className={cn(
          "flex w-full items-center gap-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          hasBody && "cursor-pointer"
        )}
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-white",
            round.kind === "defense" && "rotate-45 rounded-md",
            round.phaseStatus === "completed" && cn(toneDotClass[nodeTone], "border-transparent"),
            round.phaseStatus === "upcoming" && "border-primary bg-background text-primary",
            round.phaseStatus === "locked" && "border-dashed border-border bg-background text-muted-foreground"
          )}
          aria-hidden
        >
          <span className={cn(round.kind === "defense" && "-rotate-45")}>
            {round.phaseStatus === "completed" ? (
              <Check className="size-3.5" />
            ) : round.phaseStatus === "upcoming" ? (
              <Clock3 className="size-3.5" />
            ) : (
              <span className="block size-1.5 rounded-full bg-current" />
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold">{round.label}</p>
            {round.date && (
              <span className="text-xs text-muted-foreground tabular-nums">{formatDate(round.date, "DD/MM/YYYY")}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {round.phaseStatus === "completed" && round.kind === "review" && round.reviewOutcome && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                toneBadgeClass[reviewOutcomeTone(round.reviewOutcome)]
              )}
            >
              {round.reviewOutcome}
            </span>
          )}
          {round.phaseStatus === "completed" && defenseMeta && (
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[defenseMeta.tone])}>
              {defenseMeta.label}
            </span>
          )}
          {round.phaseStatus === "upcoming" && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              Sắp diễn ra
            </span>
          )}
          {round.phaseStatus === "locked" && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Chưa xác định
            </span>
          )}
          {hasBody && (
            <ChevronDown
              className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
            />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasBody && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 py-3.5 pl-11">
              {round.session && (
                <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="size-4 text-muted-foreground" />
                    <dt className="sr-only">Giờ</dt>
                    <dd>
                      {formatDate(round.session.startAtIso, "HH:mm")} · {round.session.durationMinutes} phút
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="size-4 text-muted-foreground" />
                    <dt className="sr-only">Phòng</dt>
                    <dd>Phòng {round.session.room}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users2 className="size-4 text-muted-foreground" />
                    <dt className="sr-only">Hội đồng</dt>
                    <dd>{round.session.councilSize} giảng viên</dd>
                  </div>
                </dl>
              )}

              {round.phaseStatus === "locked" && round.lockedReason && (
                <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground text-pretty">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {round.lockedReason}
                </p>
              )}

              {round.phaseStatus === "upcoming" && (
                <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  Chưa có kết luận — hội đồng nhập kết quả sau buổi bảo vệ.
                </p>
              )}

              {round.note && <p className="text-sm leading-6 text-foreground text-pretty">{round.note}</p>}

              {defenseMeta && round.phaseStatus === "completed" && (
                <p className="text-sm leading-6 text-muted-foreground text-pretty">
                  <span className="font-medium text-foreground">Ý nghĩa: </span>
                  {defenseMeta.meaning} <span className="font-medium text-foreground">Đợt tiếp theo: </span>
                  {defenseMeta.nextStep}
                </p>
              )}

              {round.kind === "review" && (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  Kết quả Review chỉ mang tính cảnh báo sớm, không chặn nhóm đi tiếp Defense 1.1.
                </p>
              )}

              {round.resultOwner && (
                <p className="text-xs text-muted-foreground">
                  Người nhập kết quả: {round.resultOwner.name} · {round.resultOwner.code}
                </p>
              )}

              {round.remediation && <RemediationStatus remediation={round.remediation} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
