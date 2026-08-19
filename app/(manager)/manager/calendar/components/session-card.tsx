"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { DisplaySession } from "./types";

export function SessionCard({
  session,
  dimmed,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  session: DisplaySession;
  dimmed: boolean;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      layout={!reduceMotion}
      layoutId={String(session.id)}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      draggable
      onClick={onClick}
      {...({ onDragStart, onDragEnd } as Record<string, unknown>)}
      className={cn(
        "flex h-full w-full flex-col gap-1 rounded-lg border border-violet-500/25 bg-violet-500/8 p-2 text-left transition-[opacity,box-shadow] hover:border-violet-500/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dimmed && "opacity-30",
        dragging && "opacity-40"
      )}
    >
      <span className="font-mono text-[11px] font-semibold text-violet-700 dark:text-violet-300">{session.groupCode}</span>
      {session.projectTitle && <span className="line-clamp-2 text-xs leading-snug text-foreground/80">{session.projectTitle}</span>}
      <span className="mt-auto flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground">
        {session.reviewers.map((r) => r.name.split(" ").pop()).join(" · ")}
      </span>
    </motion.button>
  );
}
