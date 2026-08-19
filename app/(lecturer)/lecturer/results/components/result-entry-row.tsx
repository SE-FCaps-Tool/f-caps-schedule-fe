"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, DoorOpen, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFENSE_LEVELS, REVIEW_OUTCOMES, ROUND_TYPE_LABEL, type PendingResultSession, type ReviewOutcome } from "./mock-data";
import { toneBadgeClass, toneDotClass } from "./tone";
import { SegmentedPicker } from "./segmented-picker";

export interface SubmittedResult {
  outcome?: ReviewOutcome;
  level?: 1 | 2 | 3 | 4;
  note?: string;
  dueDate?: string;
  verifierId?: string;
}

export function ResultEntryRow({
  session,
  submitted,
  onSubmit,
}: {
  session: PendingResultSession;
  submitted?: SubmittedResult;
  onSubmit: (result: SubmittedResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  const [outcome, setOutcome] = useState<ReviewOutcome | undefined>();
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | undefined>();
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [verifierId, setVerifierId] = useState<string | null>(null);

  const isReview = session.kind === "review";
  const selectedLevelMeta = DEFENSE_LEVELS.find((d) => d.level === level);
  const needsRemediationFields = level === 2;

  const canSave = isReview
    ? Boolean(outcome)
    : Boolean(level) && (!needsRemediationFields || (dueDate && verifierId));

  function handleSave() {
    if (!canSave) return;
    onSubmit(
      isReview
        ? { outcome, note: note || undefined }
        : {
            level,
            note: note || undefined,
            dueDate: needsRemediationFields ? dueDate : undefined,
            verifierId: needsRemediationFields ? (verifierId ?? undefined) : undefined,
          }
    );
  }

  const resultTone = submitted
    ? isReview
      ? REVIEW_OUTCOMES.find((o) => o.value === submitted.outcome)?.tone
      : DEFENSE_LEVELS.find((d) => d.level === submitted.level)?.tone
    : undefined;

  return (
    <div className="border-b border-border first:border-t last:border-b-0">
      <button
        type="button"
        onClick={() => !submitted && setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          submitted && "cursor-default"
        )}
        aria-expanded={expanded}
        disabled={Boolean(submitted)}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border-2 text-white",
            session.kind === "defense" ? "rotate-45" : "rounded-full",
            submitted && resultTone
              ? cn(toneDotClass[resultTone], "border-transparent")
              : "border-dashed border-border bg-background"
          )}
          aria-hidden
        >
          {submitted ? (
            <Check className={cn("size-3.5", session.kind === "defense" && "-rotate-45")} />
          ) : (
            <span className={cn("block size-1.5 rounded-full bg-muted-foreground/60", session.kind === "defense" && "-rotate-45")} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold">{ROUND_TYPE_LABEL[session.roundType]}</p>
            <span className="font-mono text-xs text-muted-foreground">{session.groupCode}</span>
            <span className="text-xs text-muted-foreground">· {session.myRole}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{session.groupTitleVi}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {submitted && resultTone ? (
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold text-nowrap", toneBadgeClass[resultTone])}>
              {isReview ? submitted.outcome : `Mức ${submitted.level}`}
            </span>
          ) : (
            <>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDate(session.date, "DD/MM")}</span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && !submitted && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-5 pl-11">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <DoorOpen className="size-3.5" />
                  {session.isOnline ? session.room : `Phòng ${session.room}`}
                </span>
                <span>Hội đồng: {session.councilMembers.map((m) => m.name).join(", ")}</span>
              </div>

              {isReview ? (
                <div className="space-y-2">
                  <Label>Kết quả</Label>
                  <SegmentedPicker
                    layoutId={`outcome-${session.id}`}
                    options={REVIEW_OUTCOMES.map((o) => ({ value: o.value, label: o.value, tone: o.tone }))}
                    value={outcome}
                    onChange={setOutcome}
                  />
                  <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                    Kết quả Review chỉ mang tính cảnh báo sớm, không chặn nhóm đi tiếp Defense 1.1.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Kết luận</Label>
                  <SegmentedPicker
                    layoutId={`level-${session.id}`}
                    options={DEFENSE_LEVELS.map((d) => ({ value: String(d.level), label: d.label, tone: d.tone }))}
                    value={level ? String(level) : undefined}
                    onChange={(v) => setLevel(Number(v) as 1 | 2 | 3 | 4)}
                  />
                  {selectedLevelMeta && <p className="text-xs text-muted-foreground text-pretty">{selectedLevelMeta.meaning}</p>}

                  <AnimatePresence initial={false}>
                    {needsRemediationFields && (
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-3 rounded-lg bg-amber-50/60 p-3 pt-3.5 sm:grid-cols-2 dark:bg-amber-500/5">
                          <div className="space-y-1.5">
                            <Label htmlFor={`due-${session.id}`} className="text-xs">
                              Hạn khắc phục
                            </Label>
                            <Input
                              id={`due-${session.id}`}
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="h-9 bg-background"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Người xác nhận</Label>
                            <Select value={verifierId} onValueChange={setVerifierId}>
                              <SelectTrigger className="h-9 w-full bg-background">
                                <SelectValue placeholder="Chọn Reviewer" />
                              </SelectTrigger>
                              <SelectContent>
                                {session.councilMembers.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} · {m.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor={`note-${session.id}`} className="text-xs text-muted-foreground">
                  Ghi chú (không bắt buộc)
                </Label>
                <Textarea
                  id={`note-${session.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhận xét cho nhóm..."
                  className="min-h-16 text-sm"
                />
              </div>

              <Button onClick={handleSave} disabled={!canSave} size="sm">
                Lưu kết quả
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
