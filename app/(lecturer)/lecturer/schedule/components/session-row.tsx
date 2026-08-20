"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ClipboardCheck, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/utils/formatDate";
import { ROUND_TYPE_LABEL, roundKind, type LecturerSession } from "./types";
import { STATUS_META, toneBadgeClass, toneDotClass } from "./tone";
import { SessionResultDialog } from "./session-result-dialog";

const RESULT_ENTRY_STATUSES: LecturerSession["status"][] = ["SCHEDULED", "COMPLETED"];

export function SessionRow({ session }: { session: LecturerSession }) {
  const [expanded, setExpanded] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  // BE tự enforce quyền REVIEWER/RESULT_OWNER khi submit (403 nếu sai) — API list không trả
  // myRole nên FE không gate trước, chỉ theo status.
  const canEnterResult = RESULT_ENTRY_STATUSES.includes(session.status);
  const reduceMotion = useReducedMotion();
  const kind = roundKind(session.roundType);
  const statusMeta = STATUS_META[session.status];

  return (
    <div className="border-b border-border first:border-t last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border-2",
            kind === "defense" ? "rotate-45 rounded-none" : "rounded-full",
            statusMeta.tone === "neutral"
              ? "border-border bg-background"
              : cn(toneDotClass[statusMeta.tone], "border-transparent")
          )}
          aria-hidden
        >
          <span
            className={cn(
              "block size-1.5 rounded-full",
              statusMeta.tone === "neutral" ? "bg-muted-foreground/60" : "bg-white"
            )}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTimeRange(session.startAtIso, session.endAtIso)}
            </span>
            <p className="text-sm font-semibold">{ROUND_TYPE_LABEL[session.roundType]}</p>
            <span className="font-mono text-xs text-muted-foreground">{session.groupCode}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Phòng {session.room}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", toneBadgeClass[statusMeta.tone])}>
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
            <div className="space-y-2.5 py-3.5 pl-11">
              <p className="text-sm leading-6 text-foreground text-pretty">{session.projectCode}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <DoorOpen className="size-4" />
                  Phòng {session.room}
                </span>
              </div>
              {canEnterResult && (
                <button
                  type="button"
                  onClick={() => setResultOpen(true)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-primary/30 px-3 text-sm font-medium text-primary hover:bg-primary/5"
                >
                  <ClipboardCheck className="size-4" />
                  Nhập kết quả
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {canEnterResult && (
        <SessionResultDialog session={session} open={resultOpen} onOpenChange={setResultOpen} />
      )}
    </div>
  );
}
