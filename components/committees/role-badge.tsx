import { BadgeCheck, Crown, NotebookPen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommitteeRole } from "@/lib/api/services/fetchCommittees";

/**
 * Role/label luôn tới từ BE (preview hoặc create response) — FE không tự suy ra Chủ tịch/Thư
 * ký/Thành viên từ vị trí. Màu sắc giữ tối giản: cam (brand) chỉ dành cho Chủ tịch — vị trí duy
 * nhất, còn lại dùng trung tính để không cạnh tranh với cam thương hiệu.
 */

/** Chấm màu nhỏ dùng trong danh sách gọn (card roster) — cùng bảng màu với RoleBadge. */
export function roleDotClass(role: CommitteeRole): string {
  if (role === "CHAIR") return "bg-primary";
  if (role === "SECRETARY") return "bg-amber-500";
  if (role === "REVIEWER") return "bg-sky-500";
  return "bg-emerald-500/70";
}

export function RoleBadge({
  role,
  label,
  pending,
}: {
  role: CommitteeRole;
  label: string;
  pending?: boolean;
}) {
  if (pending) {
    return (
      <span className="inline-flex h-5 w-20 animate-pulse rounded-full bg-muted" aria-hidden />
    );
  }

  if (role === "CHAIR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        <Crown className="size-3" aria-hidden />
        {label}
      </span>
    );
  }

  if (role === "SECRETARY") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <NotebookPen className="size-3" aria-hidden />
        {label}
      </span>
    );
  }

  if (role === "REVIEWER") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
        <BadgeCheck className="size-3" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
      )}
    >
      <Users className="size-3" aria-hidden />
      {label}
    </span>
  );
}
