import { Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { DashboardGroupMember } from "./mock-data";

function initialsOf(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1]?.slice(0, 1).toUpperCase() ?? "?";
}

export function GroupMembers({ members }: { members: DashboardGroupMember[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground">
        Thành viên nhóm <span className="font-normal">· {members.length} đang hoạt động</span>
      </h2>
      <ul className="mt-3">
        {members.map((member) => (
          <li
            key={member.id}
            className={cn(
              "flex items-center gap-3 border-b border-border py-3 first:border-t last:border-b-0",
              member.isCurrentUser && "bg-secondary/40 px-2 -mx-2 rounded-lg"
            )}
          >
            <Avatar size="lg">
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {initialsOf(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.fullName}
                {member.isCurrentUser && <span className="ml-1.5 text-xs text-muted-foreground">(bạn)</span>}
              </p>
              <p className="text-xs text-muted-foreground">{member.role === "LEADER" ? "Trưởng nhóm" : "Thành viên"}</p>
            </div>
            {member.role === "LEADER" && <Crown className="size-4 shrink-0 text-primary" aria-label="Trưởng nhóm" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
