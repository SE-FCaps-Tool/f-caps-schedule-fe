"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Inbox, WifiOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/admin/useAccounts";
import { useAudit } from "@/hooks/admin/useAudit";
import { AuditEntryRow } from "./audit-entry-row";
import { actionLabel, KNOWN_ACTIONS } from "./action-labels";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

export function AuditLogPage() {
  const reduceMotion = useReducedMotion();
  const [actorId, setActorId] = useState<string | null>("ALL");
  const [action, setAction] = useState<string | null>("ALL");

  const { data: accounts } = useAccounts();
  const { data: entries, isLoading, isError } = useAudit({
    actorId: actorId && actorId !== "ALL" ? Number(actorId) : undefined,
    action: action && action !== "ALL" ? action : undefined,
    limit: 100,
  });

  const accountsById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts]);
  const actorName = (id: number) => accountsById.get(id)?.display_name ?? `Tài khoản #${id}`;

  const actionsInData = useMemo(() => {
    const fromData = new Set((entries ?? []).map((e) => e.action));
    return Array.from(new Set([...KNOWN_ACTIONS, ...fromData]));
  }, [entries]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toàn bộ thao tác thay đổi dữ liệu trong hệ thống, có lý do bắt buộc.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Select value={actorId} onValueChange={setActorId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Người thực hiện">
              {(v: string) => (v === "ALL" ? "Tất cả người thực hiện" : (accountsById.get(Number(v))?.display_name ?? v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả người thực hiện</SelectItem>
            {(accounts ?? []).map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Loại hành động">
              {(v: string) => (v === "ALL" ? "Tất cả hành động" : actionLabel(v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả hành động</SelectItem>
            {actionsInData.map((a) => (
              <SelectItem key={a} value={a}>
                {actionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được audit log. Thử tải lại trang.
          </div>
        )}

        {entries && entries.length === 0 && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Inbox className="size-4 shrink-0" />
            Không có audit log khớp bộ lọc.
          </div>
        )}

        {entries && entries.length > 0 && (
          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
          >
            {entries.map((entry) => (
              <motion.div key={entry.id} variants={reduceMotion ? undefined : itemVariants}>
                <AuditEntryRow entry={entry} actorName={actorName(entry.actor_id)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
