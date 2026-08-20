"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar phải, đóng/mở theo chiều NGANG về phía bên phải (như VSCode/Explorer) — không phải
 * accordion đóng theo chiều dọc. Khi đóng chỉ còn 1 dải hẹp (rail) với nhãn dọc, bấm để mở lại.
 * `children` (panel thật, tự có heading + nút hành động riêng) chỉ ẩn/hiện chứ không unmount lại,
 * tránh gọi lại data-fetching khi đóng/mở.
 */
export function CollapsibleAsidePanel({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden border-t border-border transition-[width] duration-300 ease-out motion-reduce:transition-none lg:h-full lg:border-t-0 lg:border-l",
        open ? "lg:w-[340px]" : "lg:w-11"
      )}
    >
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label={`Mở ${title}`}
        title={`Mở ${title}`}
        className={cn(
          "hidden shrink-0 flex-1 flex-col items-center justify-center gap-3 py-4 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex",
          open && "lg:hidden"
        )}
      >
        <ChevronsLeft className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-semibold tracking-wide uppercase [writing-mode:vertical-rl]">{title}</span>
      </button>

      <div className={cn("flex min-h-0 flex-1 flex-col p-4", !open && "lg:hidden")}>{children}</div>
    </aside>
  );
}

/** Nút bấm trong heading của panel con để thu gọn — icon trỏ phải, khớp hướng thu gọn về bên phải. */
export function CollapseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Thu gọn"
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ChevronsRight className="size-4" />
    </button>
  );
}
