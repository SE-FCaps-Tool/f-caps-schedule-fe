"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusDot } from "@/app/(manager)/manager/_shared/status-dot";
import { useSemesterContext } from "@/app/(manager)/manager/_shared/semester-context";
import { useEligibleProjects, useAttachRoundResources } from "@/hooks/manager/useRounds";
import { useGroups } from "@/hooks/manager/useGroups";
import { ErrorBlock, LoadingBlock, PanelHeading, ROW_REVEAL_CLASS, rowRevealStyle } from "./round-detail-shared";
import { CollapseButton } from "./collapsible-aside-panel";
import type { RoundDetail } from "@/lib/api/services/fetchRounds";
import type { GroupListItem } from "@/lib/api/services/fetchGroups";

/** Cột phải — chọn nhóm đủ điều kiện để gắn vào round, dạng list gọn cho cột hẹp. Panel bọc ngoài đóng/mở theo chiều ngang. */
export function RoundGroupsPanel({
  roundId,
  round,
  onCollapse,
}: {
  roundId: string;
  round: RoundDetail;
  onCollapse: () => void;
}) {
  const { currentSemester } = useSemesterContext();
  const semesterId = currentSemester?.id;

  const { data: eligibleProjects, isLoading, isError } = useEligibleProjects(roundId);
  const { data: groupsResult } = useGroups(semesterId);
  const attachRoundResources = useAttachRoundResources();
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const groupById = useMemo(() => {
    const map = new Map<string, GroupListItem>();
    for (const g of groupsResult?.data ?? []) map.set(g.id, g);
    return map;
  }, [groupsResult]);

  const roundTimeslots = round.days.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date })));
  const roundRoomTypes = round.roomTypes;

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function attachSelectedGroups() {
    if (selectedGroupIds.size === 0) return;
    if (roundTimeslots.length === 0 || roundRoomTypes.length === 0) {
      toast.error("Round cần có timeslot và loại phòng trước khi gắn nhóm");
      return;
    }
    attachRoundResources.mutate(
      {
        roundId,
        payload: {
          groupIds: [...selectedGroupIds],
          timeslotIds: roundTimeslots.map((slot) => slot.id),
          roomTypes: roundRoomTypes,
        },
      },
      { onSuccess: () => setSelectedGroupIds(new Set()) }
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <PanelHeading>Nhóm</PanelHeading>
        {eligibleProjects && <span className="text-xs text-muted-foreground">{eligibleProjects.length} nhóm</span>}
        <div className="ml-auto flex items-center gap-1">
          <CollapseButton onClick={onCollapse} label="Thu gọn Nhóm" />
        </div>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">Chọn nhóm đủ điều kiện để đăng ký vào Round này.</p>

      <Button
        size="sm"
        className="w-full shrink-0"
        disabled={selectedGroupIds.size === 0 || attachRoundResources.isPending}
        onClick={attachSelectedGroups}
      >
        {attachRoundResources.isPending
          ? "Đang gắn..."
          : selectedGroupIds.size > 0
            ? `Gắn ${selectedGroupIds.size} nhóm vào Round`
            : "Gắn nhóm vào Round"}
      </Button>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock label="Không tải được danh sách nhóm." />}
      {eligibleProjects && eligibleProjects.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có nhóm/đề tài nào cho đợt này.</p>
      )}
      {eligibleProjects && eligibleProjects.length > 0 && (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {eligibleProjects.map((row, index) => {
            const group = groupById.get(row.groupId);
            const note =
              row.blockingReasons.length > 0
                ? row.blockingReasons.join(", ")
                : row.warnings.length > 0
                  ? row.warnings.map((w) => w.message).join(", ")
                  : null;
            return (
              <label
                key={row.projectId}
                className={`flex items-start gap-2.5 rounded-lg border border-border px-3 py-2 text-sm ${ROW_REVEAL_CLASS}`}
                style={rowRevealStyle(index)}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={selectedGroupIds.has(row.groupId)}
                  disabled={!row.eligible || !row.groupId || attachRoundResources.isPending}
                  onCheckedChange={() => row.groupId && toggleGroup(row.groupId)}
                  aria-label={`Chọn nhóm ${group?.code ?? row.groupId}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs font-medium">{group?.code ?? row.groupId}</span>
                    <StatusDot tone={row.eligible ? "emerald" : "red"} label={row.eligible ? "Đủ" : "Chưa đủ"} />
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${group?.leader ? "text-muted-foreground" : "font-medium text-amber-600 dark:text-amber-400"}`}
                  >
                    {group?.leader?.fullName ?? "Chưa có leader"} · {group?.memberCount ?? "—"} thành viên
                  </p>
                  {note && <p className="mt-0.5 truncate text-xs text-muted-foreground" title={note}>{note}</p>}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
