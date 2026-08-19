"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { actionLabel } from "./action-labels";
import type { AuditEntryApi } from "@/lib/api/services/fetchAudit";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1]?.slice(0, 1).toUpperCase() ?? "?";
}

function DiffFields({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));

  if (keys.length === 0) {
    return <p className="text-xs text-muted-foreground">Không có thay đổi dữ liệu chi tiết.</p>;
  }

  return (
    <dl className="space-y-1.5">
      {keys.map((key) => {
        const beforeValue = before?.[key];
        const afterValue = after?.[key];
        const changed = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
        return (
          <div key={key} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
            <dd className="flex items-center gap-1.5 font-mono text-xs">
              {beforeValue !== undefined && (
                <span className={cn(changed && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                  {JSON.stringify(beforeValue)}
                </span>
              )}
              {changed && afterValue !== undefined && (
                <>
                  <span className="text-muted-foreground/50" aria-hidden>
                    →
                  </span>
                  <span className="font-medium text-foreground">{JSON.stringify(afterValue)}</span>
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function AuditEntryRow({ entry, actorName }: { entry: AuditEntryApi; actorName: string }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-b border-border first:border-t last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 py-3.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-expanded={expanded}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
          aria-hidden
        >
          {initialsOf(actorName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold">{actorName}</p>
            <span className="text-sm text-muted-foreground">{actionLabel(entry.action)}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entry.entity_type} #{entry.entity_id} · {entry.reason}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDate(entry.occurred_at, "DD/MM HH:mm")}
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
            <div className="space-y-3 py-3.5 pl-11">
              <p className="text-sm leading-6 text-foreground text-pretty">{entry.reason}</p>
              <div className="rounded-lg bg-muted/60 p-3">
                <DiffFields before={entry.before_json} after={entry.after_json} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
