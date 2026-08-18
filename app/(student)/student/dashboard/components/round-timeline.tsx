"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { RoundResult } from "./mock-data";
import { RoundEntry } from "./round-entry";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function RoundTimeline({ rounds }: { rounds: RoundResult[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground">Chi tiết từng đợt</h2>
      <motion.div
        variants={reduceMotion ? undefined : containerVariants}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        className="mt-3"
      >
        {rounds.map((round) => (
          <motion.div key={round.id} variants={reduceMotion ? undefined : itemVariants}>
            <RoundEntry round={round} defaultExpanded={round.phaseStatus === "upcoming"} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
