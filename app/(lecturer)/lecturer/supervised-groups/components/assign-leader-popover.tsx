"use client";

import { Crown, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { GroupMemberInfo } from "./mock-data";

export function AssignLeaderPopover({
  members,
  onAssign,
}: {
  members: GroupMemberInfo[];
  onAssign: (memberId: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          />
        }
      >
        <UserPlus className="size-3.5" />
        Chỉ định trưởng nhóm
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8} className="w-64 p-1.5">
        <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">Chọn trưởng nhóm</p>
        <div className="space-y-0.5">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onAssign(member.id)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
            >
              <Crown className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{member.fullName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{member.studentCode}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
