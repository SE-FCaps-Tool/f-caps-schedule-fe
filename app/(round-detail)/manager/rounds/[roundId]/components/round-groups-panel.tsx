"use client";

import { useMemo, useState } from "react";
import { Search, TriangleAlert, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { useEligibleProjects, useAttachRoundResources, useRoundGroups } from "@/hooks/manager/useRounds";
import { useAllGroups } from "@/hooks/manager/useGroups";
import { ErrorBlock, LoadingBlock, ROW_REVEAL_CLASS, rowRevealStyle } from "./round-detail-shared";
import type { EligibleProjectRow, RoundDetail } from "@/lib/api/services/fetchRounds";
import type { GroupListItem } from "@/lib/api/services/fetchGroups";

/** Popup chọn nhóm để gắn vào Round — cùng khuôn với dialog "Mời giảng viên" của panel Giảng viên. */
function AttachGroupsDialog({
  open,
  onOpenChange,
  roundId,
  round,
  rows,
  groupById,
  projectsWithoutGroup,
  blockedGroups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  round: RoundDetail;
  rows: EligibleProjectRow[];
  groupById: Map<string, GroupListItem>;
  projectsWithoutGroup: number;
  blockedGroups: number;
}) {
  const attachRoundResources = useAttachRoundResources();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(groupId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) setSelected(new Set());
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    attachRoundResources.mutate(
      {
        roundId,
        payload: {
          groupIds: [...selected],
          timeslotIds: round.days.flatMap((day) => day.slots.map((slot) => slot.id)),
          roomTypes: round.roomTypes,
        },
      },
      {
        onSuccess: () => {
          setSelected(new Set());
          onOpenChange(false);
        },
      }
    );
  }

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.groupId));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.groupId)));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UsersRound} iconTone="primary">
            <DialogTitle>Gắn nhóm vào Round</DialogTitle>
            <DialogDescription>
              Chỉ liệt kê nhóm đủ điều kiện đăng ký cho đợt này.
              {projectsWithoutGroup > 0 && ` ${projectsWithoutGroup} đề tài chưa có nhóm.`}
              {blockedGroups > 0 && ` ${blockedGroups} nhóm chưa đủ điều kiện.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <span className="text-xs text-muted-foreground">
              {rows.length} có thể thêm · đã chọn {selected.size}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={toggleAll} disabled={rows.length === 0}>
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto py-4">
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không còn nhóm nào đủ điều kiện để thêm.
              </p>
            )}
            {rows.map((row) => {
              const group = groupById.get(row.groupId);
              const note = row.warnings.length > 0 ? row.warnings.map((w) => w.message).join(", ") : null;
              return (
                <label
                  key={row.projectId}
                  className="flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    className="mt-1"
                    checked={selected.has(row.groupId)}
                    disabled={attachRoundResources.isPending}
                    onCheckedChange={() => toggle(row.groupId)}
                    aria-label={`Chọn nhóm ${group?.code ?? row.groupId}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-medium">{group?.code ?? row.groupId}</span>
                      {note && <StatusDot tone="amber" label="Lưu ý" className="shrink-0 text-xs" />}
                    </span>
                    {group ? (
                      <span
                        className={`mt-0.5 block truncate text-xs ${group.leader ? "text-muted-foreground" : "font-medium text-amber-600 dark:text-amber-400"}`}
                      >
                        {group.leader?.fullName ?? "Chưa có leader"} · {group.memberCount} thành viên
                      </span>
                    ) : (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">Đang tải thông tin nhóm…</span>
                    )}
                    {note && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={note}>
                        {note}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={attachRoundResources.isPending || selected.size === 0}>
              {attachRoundResources.isPending
                ? "Đang gắn..."
                : selected.size > 0
                  ? `Gắn ${selected.size} nhóm vào Round`
                  : "Gắn nhóm vào Round"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cột phải — danh sách nhóm của round (đã gắn + đủ điều kiện), dạng list gọn cho cột hẹp.
 *  Việc chọn nhiều nhóm để gắn nằm trong popup vì cột này quá hẹp. Panel bọc ngoài đóng/mở theo chiều ngang. */
export function RoundGroupsPanel({
  roundId,
  round,
}: {
  roundId: string;
  round: RoundDetail;
}) {
  const { data: eligibleProjects, isLoading, isError } = useEligibleProjects(roundId);
  const {
    data: attachedGroups,
    isLoading: isLoadingAttached,
    isError: isAttachedError,
  } = useRoundGroups(roundId);
  const { data: groups } = useAllGroups(round.semesterId);
  const [attachOpen, setAttachOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ATTACHED" | "READY" | "NOTE">("ALL");

  const groupById = useMemo(() => {
    const map = new Map<string, GroupListItem>();
    for (const group of groups ?? []) {
      map.set(group.id, group);
      map.set(group.id.startsWith("grp_") ? group.id : `grp_${group.id}`, group);
    }
    return map;
  }, [groups]);

  /** Panel chỉ liệt kê nhóm đã gắn + nhóm đủ điều kiện; số nhóm bị loại vẫn báo lại để
   *  Manager biết phải sang trang Nhóm/Đề tài xử lý. */
  const { rows, projectsWithoutGroup, blockedGroups } = useMemo(() => {
    const all = eligibleProjects ?? [];
    const rows = all.filter((row) => row.eligible && row.groupId);
    return {
      rows,
      projectsWithoutGroup: all.filter((row) => !row.checks.hasGroup).length,
      blockedGroups: all.filter((row) => row.checks.hasGroup && !row.eligible).length,
    };
  }, [eligibleProjects]);

  /**
   * Một danh sách phẳng như panel Giảng viên — nhóm đã gắn xếp trước, nhóm đủ điều kiện xếp sau,
   * phân biệt bằng chấm trạng thái chứ không tách mục con (giảng viên cũng trộn PENDING/ACCEPTED
   * trong cùng list).
   */
  const panelRows = useMemo(() => {
    const attached = (attachedGroups ?? []).map((group) => ({
      key: `attached-${group.groupId}`,
      code: group.groupCode,
      projectCode: group.projectCode,
      leaderName: group.leaderName ?? null,
      memberCount: group.activeMemberCount,
      tone: "sky" as const,
      label: "Đã gắn",
      note: null as string | null,
    }));

    const attachedIds = new Set((attachedGroups ?? []).map((group) => group.groupId));
    const eligible = rows
      .filter((row) => !attachedIds.has(row.groupId))
      .map((row) => {
        const group = groupById.get(row.groupId);
        const note = row.warnings.length > 0 ? row.warnings.map((w) => w.message).join(", ") : null;
        return {
          key: `eligible-${row.projectId}`,
          code: group?.code ?? row.groupId,
          projectCode: group?.project?.code ?? null,
          leaderName: group?.leader?.fullName ?? null,
          memberCount: group?.memberCount ?? null,
          tone: note ? ("amber" as const) : ("emerald" as const),
          label: note ? "Lưu ý" : "Có thể gắn",
          note,
        };
      });

    return [...attached, ...eligible];
  }, [attachedGroups, rows, groupById]);

  const attachedCount = panelRows.filter((row) => row.tone === "sky").length;
  const readyCount = panelRows.filter((row) => row.tone === "emerald").length;
  const noteCount = panelRows.filter((row) => row.tone === "amber").length;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredPanelRows = useMemo(() => {
    return panelRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [row.code, row.projectCode, row.leaderName, row.memberCount !== null ? String(row.memberCount) : null]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ATTACHED" && row.tone === "sky") ||
        (filter === "READY" && row.tone === "emerald") ||
        (filter === "NOTE" && row.tone === "amber");

      return matchesSearch && matchesFilter;
    });
  }, [filter, normalizedSearch, panelRows]);

  const filters = [
    { value: "ALL" as const, label: "Tất cả", count: panelRows.length },
    { value: "ATTACHED" as const, label: "Đã gắn", count: attachedCount },
    { value: "READY" as const, label: "Chưa gắn", count: readyCount },
    { value: "NOTE" as const, label: "Có lưu ý", count: noteCount },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Nhóm</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {eligibleProjects && attachedGroups ? panelRows.length : "…"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {attachedCount} đã gắn · {readyCount} có thể gắn
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" aria-label="Gắn nhóm vào Round" title="Gắn nhóm vào Round" onClick={() => setAttachOpen(true)}>
            <UsersRound />
            <span className="hidden sm:inline">Gắn nhóm</span>
            <span className="sm:hidden">Gắn</span>
          </Button>
        </div>
      </div>

      {(projectsWithoutGroup > 0 || blockedGroups > 0) && (
        <div className="flex shrink-0 items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">Cần xử lý trước khi gắn</p>
            <p className="mt-0.5">
              {projectsWithoutGroup > 0 && `${projectsWithoutGroup} đề tài chưa có nhóm. `}
              {blockedGroups > 0 && `${blockedGroups} nhóm chưa đủ điều kiện.`}
            </p>
            <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">Mở trang Nhóm/Đề tài để xử lý trước khi gắn.</p>
          </div>
        </div>
      )}

      <div className="shrink-0 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã nhóm, đề tài hoặc leader..."
            aria-label="Tìm nhóm theo mã nhóm, đề tài hoặc leader"
            className="h-9 pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              title="Xóa tìm kiếm"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Lọc nhóm">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="xs"
              variant={filter === item.value ? "secondary" : "ghost"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className="shrink-0"
            >
              {item.label}
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {(isLoading || isLoadingAttached) && <LoadingBlock />}
      {(isError || isAttachedError) && <ErrorBlock label="Không tải được danh sách nhóm." />}
      {eligibleProjects && attachedGroups && panelRows.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có nhóm nào cho đợt này.</p>
      )}
      {panelRows.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {filteredPanelRows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy nhóm phù hợp.</p>
          )}
          {filteredPanelRows.length > 0 && (
            <div className="divide-y divide-border/80">
              {filteredPanelRows.map((row, index) => (
                <div
                  key={row.key}
                  className={`group flex w-full items-center gap-3 px-1 py-3 text-left text-sm transition-colors hover:bg-muted/35 ${ROW_REVEAL_CLASS}`}
                  style={rowRevealStyle(index)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold tracking-tight" title={row.code}>
                      {row.code}
                    </p>
                    {row.projectCode && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground" title={row.projectCode}>
                        {row.projectCode}
                      </p>
                    )}
                    <p
                      className={`mt-1 flex items-center gap-1.5 truncate text-xs ${row.leaderName ? "text-muted-foreground" : "font-medium text-amber-700 dark:text-amber-400"}`}
                    >
                      <UsersRound className="size-3.5 shrink-0" aria-hidden />
                      <span>{row.leaderName ?? "Chưa có leader"}</span>
                      {row.memberCount !== null && <span>· {row.memberCount} thành viên</span>}
                    </p>
                    {row.note && (
                      <p className="mt-1 truncate text-xs text-amber-700 dark:text-amber-400" title={row.note}>
                        {row.note}
                      </p>
                    )}
                  </div>
                  <StatusDot
                    tone={row.tone}
                    label={row.label}
                    className="shrink-0 rounded-full bg-muted/60 px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AttachGroupsDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        roundId={roundId}
        round={round}
        rows={rows}
        groupById={groupById}
        projectsWithoutGroup={projectsWithoutGroup}
        blockedGroups={blockedGroups}
      />
    </div>
  );
}
