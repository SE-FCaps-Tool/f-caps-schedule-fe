"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ResultTone } from "./mock-data";
import { toneSolidClass } from "./tone";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  tone: ResultTone;
}

export function SegmentedPicker<T extends string>({
  layoutId,
  options,
  value,
  onChange,
}: {
  layoutId: string;
  options: SegmentedOption<T>[];
  value?: T;
  onChange: (value: T) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5" role="radiogroup">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative min-h-9 rounded-lg px-3.5 text-sm font-semibold transition-colors",
              selected ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {selected && (
              <motion.span
                layoutId={reduceMotion ? undefined : layoutId}
                className={cn("absolute inset-0 rounded-lg", toneSolidClass[option.tone])}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
