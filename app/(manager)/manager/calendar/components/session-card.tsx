"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { DisplaySession } from "./types";

export function SessionCard({
  session,
  dimmed,
  dragging,
  readOnly,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  session: DisplaySession;
  dimmed: boolean;
  dragging: boolean;
  readOnly?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const visibleReviewers = session.reviewers.slice(0, 2);
  const remainingReviewers = Math.max(0, session.reviewers.length - visibleReviewers.length);
  const reviewerLabel = session.reviewers.map((reviewer) => reviewer.name).join(" · ");

  return (
    <motion.button
      type="button"
      layout={!reduceMotion}
      layoutId={String(session.id)}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      draggable={!readOnly}
      onClick={onClick}
      {...(readOnly ? {} : ({ onDragStart, onDragEnd } as Record<string, unknown>))}
      title={`${session.groupCode}${session.projectTitle ? ` — ${session.projectTitle}` : ""}${reviewerLabel ? ` — ${reviewerLabel}` : ""}`}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col gap-1 overflow-hidden rounded-lg border border-violet-500/25 bg-violet-500/8 p-2 text-left transition-[opacity,box-shadow] hover:border-violet-500/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dimmed && "opacity-30",
        dragging && "opacity-40"
      )}
    >
      <span className="shrink-0 truncate font-mono text-[11px] font-semibold text-violet-700 dark:text-violet-300">{session.groupCode}</span>
      {session.projectTitle && <span className="line-clamp-1 min-h-0 text-xs leading-snug text-foreground/80">{session.projectTitle}</span>}
      {session.reviewers.length > 0 && (
        <span className="mt-auto block min-w-0 shrink-0 truncate pt-0.5 text-[10px] text-muted-foreground">
          {visibleReviewers.map((reviewer) => reviewer.name.split(" ").pop()).join(" · ")}
          {remainingReviewers > 0 && <span className="font-medium text-foreground/70"> +{remainingReviewers}</span>}
        </span>
      )}
    </motion.button>
  );
}
