"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Committee } from "@/lib/api/services/fetchCommittees";
import { roleDotClass } from "./role-badge";
import { DeleteCommitteeDialog } from "./delete-committee-dialog";

const VISIBLE_MEMBERS = 5;
const CARD_TONES = [
  { avatar: "bg-orange-100 text-orange-700", marker: "bg-orange-500" },
  { avatar: "bg-sky-100 text-sky-700", marker: "bg-sky-500" },
  { avatar: "bg-emerald-100 text-emerald-700", marker: "bg-emerald-500" },
  { avatar: "bg-violet-100 text-violet-700", marker: "bg-violet-500" },
  { avatar: "bg-rose-100 text-rose-700", marker: "bg-rose-500" },
] as const;

function getCardTone(code: string) {
  const score = [...code].reduce((total, char) => total + char.charCodeAt(0), 0);
  return CARD_TONES[score % CARD_TONES.length];
}

function getInitials(name: string | null, code: string) {
  const words = (name ?? code).trim().split(/\s+/).filter(Boolean);
  return words.length > 1
    ? `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase()
    : (words[0]?.slice(0, 2) ?? "HD").toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CommitteeCard({
  committee,
  selected,
  onSelectedChange,
}: {
  committee: Committee;
  selected: boolean;
  onSelectedChange: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const visibleMembers = committee.members.slice(0, VISIBLE_MEMBERS);
  const overflowCount = committee.members.length - visibleMembers.length;
  const tone = getCardTone(committee.code);

  return (
    <>
      <div
        className={cn(
          "group relative flex min-h-52 flex-col rounded-xl border border-border bg-card p-4 transition-transform duration-200 motion-reduce:transition-none motion-reduce:hover:transform-none hover:-translate-y-0.5 hover:border-primary/40",
          selected && "border-primary/60 bg-primary/[0.025] ring-2 ring-primary/10"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <label className="flex cursor-pointer items-center">
              <Checkbox
                checked={selected}
                onCheckedChange={onSelectedChange}
                aria-label={`Chọn ${committee.code}`}
              />
            </label>
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold", tone.avatar)}>
              {getInitials(committee.code, committee.code)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-bold tracking-tight">{committee.code}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                Danh mục nháp
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá ${committee.code}`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleting(true)}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="mt-4 space-y-1.5">
          {visibleMembers.map((member) => (
            <div key={member.lecturerId} className="flex items-center gap-2 rounded-lg bg-muted/45 px-2 py-1.5 text-sm">
              <span
                className={cn("size-2 shrink-0 rounded-full", roleDotClass(member.role))}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{member.displayName}</span>
              <span className="max-w-24 shrink-0 truncate text-[11px] text-muted-foreground">{member.roleLabel}</span>
            </div>
          ))}
          {overflowCount > 0 && (
            <p className="pl-3.5 text-xs text-muted-foreground">+{overflowCount} thành viên khác</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" aria-hidden />
            {committee.memberCount} thành viên
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className={cn("size-1.5 rounded-full", tone.marker)} aria-hidden />
            {formatDate(committee.createdAt)}
          </span>
        </div>
      </div>

      <DeleteCommitteeDialog committee={deleting ? committee : null} open={deleting} onOpenChange={setDeleting} />
    </>
  );
}
