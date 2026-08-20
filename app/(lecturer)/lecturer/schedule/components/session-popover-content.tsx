import { DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/utils/formatDate";
import { ROUND_TYPE_LABEL, type LecturerSession } from "./types";
import { STATUS_META, toneBadgeClass } from "./tone";

export function SessionPopoverContent({ session }: { session: LecturerSession }) {
  const statusMeta = STATUS_META[session.status];

  return (
    <div className="space-y-2.5 p-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{ROUND_TYPE_LABEL[session.roundType]}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatTimeRange(session.startAtIso, session.endAtIso)}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", toneBadgeClass[statusMeta.tone])}>
          {statusMeta.label}
        </span>
      </div>

      <p className="font-mono text-xs text-muted-foreground">{session.groupCode}</p>
      <p className="text-sm leading-5 text-foreground text-pretty">{session.projectCode}</p>

      <div className="space-y-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <DoorOpen className="size-3.5 shrink-0" />
          Phòng {session.room}
        </p>
      </div>
    </div>
  );
}
