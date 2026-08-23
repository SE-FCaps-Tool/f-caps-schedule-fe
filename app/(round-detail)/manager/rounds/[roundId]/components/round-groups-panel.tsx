"use client";

import { useMemo, useState } from "react";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ErrorBlock, LoadingBlock, PanelHeading, ROW_REVEAL_CLASS, rowRevealStyle } from "./round-detail-shared";
import { CollapseButton } from "./collapsible-aside-panel";
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
  onCollapse,
}: {
  roundId: string;
  round: RoundDetail;
  onCollapse: () => void;
}) {
  const { data: eligibleProjects, isLoading, isError } = useEligibleProjects(roundId);
  const {
    data: attachedGroups,
    isLoading: isLoadingAttached,
    isError: isAttachedError,
  } = useRoundGroups(roundId);
  const { data: groups } = useAllGroups(round.semesterId);
  const [attachOpen, setAttachOpen] = useState(false);

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
          label: note ? "Lưu ý" : "Đủ",
          note,
        };
      });

    return [...attached, ...eligible];
  }, [attachedGroups, rows, groupById]);


  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Cùng bố cục với panel Giảng viên: đếm nằm trong tên panel, hành động là nút icon
          trên header, thân panel là danh sách phẳng những gì đã gắn — không chia mục con. */}
      <div className="flex shrink-0 items-center gap-1">
        <PanelHeading>Nhóm{panelRows.length > 0 ? ` (${panelRows.length})` : ""}</PanelHeading>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Gắn nhóm vào Round"
            title="Gắn nhóm vào Round"
            onClick={() => setAttachOpen(true)}
          >
            <UsersRound />
          </Button>
          <CollapseButton onClick={onCollapse} label="Thu gọn Nhóm" />
        </div>
      </div>

      {(projectsWithoutGroup > 0 || blockedGroups > 0) && (
        <p className="shrink-0 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          {projectsWithoutGroup > 0 && `${projectsWithoutGroup} đề tài chưa có nhóm. `}
          {blockedGroups > 0 && `${blockedGroups} nhóm chưa đủ điều kiện. `}
          Xử lý ở trang Nhóm/Đề tài trước khi gắn.
        </p>
      )}

      {(isLoading || isLoadingAttached) && <LoadingBlock />}
      {(isError || isAttachedError) && <ErrorBlock label="Không tải được danh sách nhóm." />}
      {eligibleProjects && attachedGroups && panelRows.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có nhóm nào cho đợt này.</p>
      )}
      {panelRows.length > 0 && (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {panelRows.map((row, index) => (
            <div
              key={row.key}
              className={`flex w-full items-start justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm ${ROW_REVEAL_CLASS}`}
              style={rowRevealStyle(index)}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {row.code}
                  {row.projectCode && (
                    <span className="font-normal text-muted-foreground"> — {row.projectCode}</span>
                  )}
                </p>
                <p
                  className={`mt-0.5 truncate text-xs ${row.leaderName ? "text-muted-foreground" : "font-medium text-amber-600 dark:text-amber-400"}`}
                >
                  {row.leaderName ?? "Chưa có leader"}
                  {row.memberCount !== null && ` · ${row.memberCount} thành viên`}
                </p>
                {row.note && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.note}>
                    {row.note}
                  </p>
                )}
              </div>
              <StatusDot tone={row.tone} label={row.label} className="shrink-0 text-xs" />
            </div>
          ))}
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
