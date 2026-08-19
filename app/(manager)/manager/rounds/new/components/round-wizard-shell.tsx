"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoundWizardShellProps {
  title: string;
  cancelHref: string;
  stepLabels: string[];
  /** 1-indexed */
  step: number;
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  isSubmitting?: boolean;
  children: ReactNode;
}

function StepIndicator({ stepLabels, step }: { stepLabels: string[]; step: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="hidden items-center md:flex" aria-label="Tiến trình">
      {stepLabels.map((label, index) => {
        const n = index + 1;
        const isDone = n < step;
        const isCurrent = n === step;
        return (
          <li key={label} className="flex items-center">
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "relative flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCurrent && !reduceMotion && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    aria-hidden
                  />
                )}
                {isDone ? <Check className="size-3.5" strokeWidth={2.5} /> : n}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-300",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </span>
            {n < stepLabels.length && (
              <span className="relative mx-3 h-px w-8 overflow-hidden bg-border" aria-hidden>
                <motion.span
                  className="absolute inset-y-0 left-0 bg-emerald-500"
                  initial={false}
                  animate={{ width: isDone ? "100%" : "0%" }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function RoundWizardShell({
  title,
  cancelHref,
  stepLabels,
  step,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  nextLabel,
  isSubmitting,
  children,
}: RoundWizardShellProps) {
  const reduceMotion = useReducedMotion();
  const progressPct = (step / stepLabels.length) * 100;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4 md:px-8">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={cancelHref} aria-label="Huỷ, quay lại danh sách đợt đánh giá" />}
        >
          <X />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        </div>
        <StepIndicator stepLabels={stepLabels} step={step} />
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground md:hidden">
          Bước {step}/{stepLabels.length}
        </span>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-10 md:px-8 md:py-14">{children}</div>
      </main>

      <footer className="relative shrink-0 border-t border-border">
        <div className="absolute inset-x-0 top-0 h-1 bg-muted" aria-hidden>
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-4 md:px-8">
          <Button type="button" variant="outline" disabled={!canGoBack} onClick={onBack}>
            Quay lại
          </Button>
          <Button type="button" disabled={!canGoNext || isSubmitting} onClick={onNext}>
            {isSubmitting ? "Đang tạo..." : nextLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
