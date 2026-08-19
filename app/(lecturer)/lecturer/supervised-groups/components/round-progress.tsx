import { cn } from "@/lib/utils";
import { DEFENSE_LEVELS, type RoundResult } from "./mock-data";
import { toneDotClass } from "./tone";

function reviewOutcomeTone(outcome: RoundResult["reviewOutcome"]) {
  if (outcome === "Không đạt") return "red" as const;
  if (outcome === "Cần sửa") return "amber" as const;
  return "emerald" as const;
}

export function roundTone(round: RoundResult) {
  if (round.phaseStatus !== "completed") return "neutral" as const;
  if (round.kind === "review") return reviewOutcomeTone(round.reviewOutcome);
  return round.defenseLevel ? DEFENSE_LEVELS[round.defenseLevel].tone : ("neutral" as const);
}

export function RoundProgress({ rounds }: { rounds: RoundResult[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {rounds.map((round) => {
        const tone = roundTone(round);
        return (
          <span
            key={round.id}
            title={round.label}
            className={cn(
              "size-2 shrink-0",
              round.kind === "defense" ? "rotate-45" : "rounded-full",
              round.phaseStatus === "completed" && toneDotClass[tone],
              round.phaseStatus === "upcoming" && "bg-primary/40 ring-1 ring-primary",
              round.phaseStatus === "locked" && "bg-border"
            )}
          />
        );
      })}
    </div>
  );
}
