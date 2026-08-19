"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import type { LecturerSession } from "./types";
import { SessionRow } from "./session-row";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

function sameDay(a: string, b: string) {
  return formatDate(a, "YYYY-MM-DD") === formatDate(b, "YYYY-MM-DD");
}

export function ScheduleListView({ sessions, todayIso }: { sessions: LecturerSession[]; todayIso: string }) {
  const reduceMotion = useReducedMotion();
  const sorted = [...sessions].sort((a, b) => a.startAtIso.localeCompare(b.startAtIso));

  const groups: { dateIso: string; items: LecturerSession[] }[] = [];
  for (const session of sorted) {
    const last = groups.at(-1);
    if (last && sameDay(last.dateIso, session.startAtIso)) {
      last.items.push(session);
    } else {
      groups.push({ dateIso: session.startAtIso, items: [session] });
    }
  }

  if (groups.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có phiên nào được xếp cho bạn.</p>;
  }

  return (
    <motion.div
      variants={reduceMotion ? undefined : containerVariants}
      initial={reduceMotion ? undefined : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      className="space-y-7"
    >
      {groups.map((group) => {
        const isToday = sameDay(group.dateIso, todayIso);
        return (
          <motion.div key={group.dateIso} variants={reduceMotion ? undefined : itemVariants}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              {formatDate(group.dateIso, "dddd, DD/MM/YYYY")}
              {isToday && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Hôm nay
                </span>
              )}
            </h2>
            <div className={cn("mt-2")}>
              {group.items.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
