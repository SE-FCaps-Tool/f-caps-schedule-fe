import type { ReactNode } from "react";

export function DetailRow({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-3 first:border-t last:border-b-0">
      <span className="pt-0.5 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
        {hint && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}
