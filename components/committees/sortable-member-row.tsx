"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommitteeMember } from "@/lib/api/services/fetchCommittees";
import type { DraftMember } from "./builder-types";
import { RoleBadge } from "./role-badge";

function getInitials(name: string, code: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1
    ? `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase()
    : (words[0]?.slice(0, 2) ?? code.slice(0, 2)).toUpperCase();
}

export function SortableMemberRow({
  member,
  preview,
  previewPending,
  onRemove,
}: {
  member: DraftMember;
  /** Role/label thật từ lần preview gần nhất khớp externalId này — undefined nếu chưa có kết quả. */
  preview: CommitteeMember | undefined;
  previewPending: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.externalId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 transition-colors hover:bg-muted/35",
        isDragging && "z-10 shadow-md"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Kéo để đổi vị trí ${member.displayName}`}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-[11px] font-bold text-secondary-foreground">
        {getInitials(member.displayName, member.lecturerCode)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{member.lecturerCode}</p>
      </div>

      <RoleBadge
        role={preview?.role ?? "MEMBER"}
        label={preview?.roleLabel ?? ""}
        pending={previewPending || !preview}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Xoá ${member.displayName} khỏi nhóm`}
        onClick={onRemove}
      >
        <X />
      </Button>
    </div>
  );
}
