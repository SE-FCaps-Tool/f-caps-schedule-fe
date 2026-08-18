import { Check, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { DEFENSE_LEVELS, type RoundResult } from "./mock-data";
import { toneDotClass } from "./tone";

function reviewOutcomeTone(outcome: RoundResult["reviewOutcome"]) {
  if (outcome === "Không đạt") return "red" as const;
  if (outcome === "Cần sửa") return "amber" as const;
  return "emerald" as const;
}

function nodeTone(round: RoundResult) {
  if (round.phaseStatus !== "completed") return "neutral" as const;
  if (round.kind === "review") return reviewOutcomeTone(round.reviewOutcome);
  return round.defenseLevel ? DEFENSE_LEVELS[round.defenseLevel].tone : ("neutral" as const);
}

function dayGap(from?: string, to?: string) {
  if (!from || !to) return 1;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(Math.round(ms / 86_400_000), 1);
}

export function HorizontalTimeline({ rounds }: { rounds: RoundResult[] }) {
  return (
    <div className="border-y border-border py-7">
      <div className="flex items-start">
        {rounds.map((round, index) => {
          const next = rounds[index + 1];
          const tone = nodeTone(round);

          return (
            <div key={round.id} className="contents">
              <div className="flex shrink-0 flex-col items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-white",
                    round.kind === "defense" && "rotate-45 rounded-md",
                    round.phaseStatus === "completed" && cn(toneDotClass[tone], "border-transparent"),
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
                <div className="max-w-24 text-center">
                  <p className="text-xs leading-4.5 font-medium text-pretty">{round.label}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {round.date ? formatDate(round.date, "DD/MM") : "—"}
                  </p>
                </div>
              </div>

              {next && (
                <div
                  aria-hidden
                  className={cn(
                    "mt-3.5 h-px min-w-8",
                    round.date && next.date ? "bg-border" : "border-t border-dashed border-border"
                  )}
                  style={{ flexGrow: dayGap(round.date, next.date) }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
