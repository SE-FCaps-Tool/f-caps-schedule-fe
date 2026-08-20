"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { WifiOff, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/app/(manager)/manager/_shared/status-dot";
import type { RoundStatus } from "@/lib/api/services/fetchRounds";

/**
 * Trạng thái mà spec chưa có action endpoint cụ thể (thuộc Phase 8) — chỉ hiển thị, chưa bấm được.
 * REGISTRATION_CLOSED không còn ở đây: xếp lịch giờ thao tác trực tiếp trong panel Lịch
 * (Generate + Set Active theo spec §58/§64), không có transition riêng để "bắt đầu xếp lịch".
 * SCHEDULED cũng không còn ở đây: Công bố lịch giờ là nút thật, gate theo publish-readiness (§29/§69/§70).
 */
export const FUTURE_PHASE_LABEL: Partial<Record<RoundStatus, string>> = {
  COMPLETED: "Khóa đợt",
};

export function notImplemented(action: string) {
  toast.info(`${action} — chưa có trong spec BE, cần chốt endpoint`);
}

/** Chip màu nhẹ sau icon stat — cùng bảng màu với StatusDot, dùng có ý nghĩa (không trang trí tuỳ ý). */
const ICON_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function StatIcon({ icon: Icon, tone = "neutral" }: { icon: LucideIcon; tone?: StatusTone }) {
  return (
    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", ICON_TONE_CLASSES[tone])}>
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

/** Hàng stat — dùng trong danh sách dọc (sidebar) lẫn lưới ngang, tuỳ container cha. */
export function StatBlock({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <StatIcon icon={icon} tone={tone} />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

/** Đếm số chạy tới `target` khi giá trị đổi — dùng cho stat vừa tải xong, không dùng cho giá trị đã có sẵn. */
function useCountUp(target: number, durationMs = 450) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (reducedMotion || from === target) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reducedMotion]);

  return display;
}

/** StatBlock cho số vừa tải xong (đếm lên từ 0) — giữ "…" cho tới khi có dữ liệu thật. */
export function StatNumber({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  const display = useCountUp(value ?? 0);
  return (
    <div className="flex items-start gap-2.5">
      {icon && <StatIcon icon={icon} tone={tone} />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value === null ? "…" : display}</p>
      </div>
    </div>
  );
}

/** Delay stagger nhẹ cho hàng danh sách khi vào panel — chặn ở hàng thứ 8 để danh sách dài không bị trễ. */
export function rowRevealStyle(index: number): React.CSSProperties {
  return { animationDelay: `${Math.min(index, 8) * 35}ms`, animationDuration: "260ms" };
}
export const ROW_REVEAL_CLASS =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-backwards";

export function LoadingBlock() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function ErrorBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <WifiOff className="size-4 shrink-0" />
      {label}
    </div>
  );
}

/** Tiêu đề nhỏ dùng chung cho từng khu vực trong 3 cột (Cấu hình / Chú thích / Giảng viên / Group). */
export function PanelHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>;
}
