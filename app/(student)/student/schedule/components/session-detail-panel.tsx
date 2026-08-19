"use client";

import { CalendarClock, ClipboardCopy, MessageSquareText, Users2 } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ScheduleRound, ScheduleSlot, ScheduleTone } from "./types";

const toneBandClass: Record<ScheduleTone, string> = {
  neutral: "bg-muted",
  orange: "bg-primary/10",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10",
  amber: "bg-amber-50 dark:bg-amber-500/10",
  sky: "bg-sky-50 dark:bg-sky-500/10",
  red: "bg-destructive/10",
};

const kindIcon: Record<ScheduleSlot["kind"], typeof CalendarClock> = {
  official: CalendarClock,
};

function ActionButton({
  icon: Icon,
  children,
  variant = "secondary",
}: {
  icon: typeof ClipboardCopy;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function reviewerInitials(name: string) {
  return name.trim().split(/\s+/).at(-1)?.slice(0, 1).toUpperCase() ?? "?";
}

function DetailRow({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <span className="pt-0.5 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
        {hint && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}

export function SessionDetailPanel({ round, slot }: { round: ScheduleRound; slot: ScheduleSlot }) {
  const KindIcon = kindIcon[slot.kind];

  return (
    <div className="text-card-foreground">
      <div className={cn("rounded-t-lg p-4", toneBandClass[slot.tone])}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium">
            <KindIcon className="size-3.5" />
            {round.label}
          </span>
          <span className="inline-flex items-center rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium">
            {slot.statusLabel}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-balance">{slot.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground text-pretty">{round.description}</p>
      </div>

      <div className="divide-y divide-border border-b border-border px-4">
        <DetailRow
          label="Thời gian"
          value={`${slot.startTime} – ${slot.endTime}`}
          hint={formatDate(slot.startAt, "dddd, DD/MM/YYYY")}
        />
        <DetailRow
          label="Phòng"
          value={slot.room ?? "Chưa gán"}
          hint="Theo BR-RND-02, phòng gán sau khi xếp lịch"
        />
        <DetailRow
          label="Hội đồng"
          value={`${round.councilSize} reviewer · ${round.durationMinutes} phút`}
        />
        <DetailRow
          label="Mã hội đồng"
          value={slot.councilCode ?? "Chưa gán"}
          hint={round.statusLabel}
        />
      </div>

      <div className="border-b border-border p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Users2 className="size-4 text-primary" />
          Reviewer
        </p>
        {slot.reviewers?.length ? (
          <ul className="mt-3 space-y-2.5">
            {slot.reviewers.map((reviewer) => (
              <li key={reviewer.id} className="flex items-center gap-2.5">
                <Avatar>
                  <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                    {reviewerInitials(reviewer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{reviewer.name}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Hội đồng sẽ xuất hiện sau khi Moderator đóng đăng ký và công bố lịch.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        <ActionButton icon={MessageSquareText} variant="primary">
          Xin đổi lịch
        </ActionButton>
        <ActionButton icon={ClipboardCopy}>Copy giờ</ActionButton>
      </div>
    </div>
  );
}
