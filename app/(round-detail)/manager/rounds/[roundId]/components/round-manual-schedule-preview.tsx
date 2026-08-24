"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoundGroups, useRoundInvitations } from "@/hooks/manager/useRounds";
import { useRooms } from "@/hooks/useRooms";
import { formatDate } from "@/lib/utils/formatDate";
import type { AttachedRoundGroup, RoundDetail, RoundInvitation } from "@/lib/api/services/fetchRounds";
import type { RoomApiItem } from "@/lib/api/services/fetchRooms";
import {
  buildReviewerRoles,
  useManualScheduleDraftStore,
  type ManualScheduleSession,
} from "./round-manual-schedule-board";

function cellKey(date: string, slotId: string) {
  return `${date}__${slotId}`;
}

function dayStartKey(date: string, startTime: string) {
  return `${date}__${startTime}`;
}

function groupIdVariants(groupId: string) {
  const variants = new Set([groupId]);
  if (groupId.startsWith("grp_")) variants.add(groupId.slice(4));
  else variants.add(`grp_${groupId}`);
  return variants;
}

function PreviewChip({
  session,
  roleLabelByKey,
  groupById,
  roomById,
  lecturerById,
}: {
  session: ManualScheduleSession;
  roleLabelByKey: Map<string, string>;
  groupById: Map<string, AttachedRoundGroup>;
  roomById: Map<string, RoomApiItem>;
  lecturerById: Map<string, RoundInvitation>;
}) {
  const groupCodes = session.groupIds.map((groupId) => groupById.get(groupId)?.groupCode ?? groupId);
  const room = session.roomId ? roomById.get(session.roomId) : undefined;
  const reviewers = Object.entries(session.reviewerIds)
    .map(([role, lecturerId]) => {
      const lecturer = lecturerId ? lecturerById.get(lecturerId) : undefined;
      return lecturer ? `${roleLabelByKey.get(role) ?? role}: ${lecturer.lecturer.code}` : null;
    })
    .filter((row): row is string => Boolean(row));

  return (
    <div className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2.5 py-2 text-xs">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate font-mono font-semibold text-violet-700 dark:text-violet-300">
            {groupCodes.length > 0
              ? `${groupCodes.slice(0, 2).join(", ")}${groupCodes.length > 2 ? ` +${groupCodes.length - 2}` : ""}`
              : "Chưa chọn nhóm"}
          </span>
          <span className="mt-0.5 block truncate text-muted-foreground">
            {room?.code ?? (session.roomId ? `Phòng ${session.roomId}` : "Chưa gán phòng")} · {session.groupIds.length} nhóm
          </span>
        </span>
      </div>
      <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
        {reviewers.length > 0 ? reviewers.join(" · ") : "Chưa chọn giảng viên chấm"}
      </p>
    </div>
  );
}

export function RoundManualSchedulePreview({ roundId, round }: { roundId: string; round: RoundDetail }) {
  const roles = useMemo(() => buildReviewerRoles(round.reviewerCount), [round.reviewerCount]);
  const roleLabelByKey = useMemo(() => new Map(roles.map((role) => [role.key, role.label])), [roles]);
  const [sessions] = useManualScheduleDraftStore(roundId, roles);
  const { data: attachedGroups, isLoading: groupsLoading } = useRoundGroups(roundId);
  const { data: invitations, isLoading: invitationsLoading } = useRoundInvitations(roundId);
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const dates = useMemo(
    () => round.days.filter((day) => day.slots.length > 0).map((day) => day.date),
    [round.days]
  );

  const timeRows = useMemo(() => {
    const rows = new Map<string, { startTime: string; endTime: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) rows.set(slot.startTime, { startTime: slot.startTime, endTime: slot.endTime });
    }
    return Array.from(rows.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [round.days]);

  const slotsByCell = useMemo(() => {
    const map = new Map<string, { id: string; startTime: string; endTime: string }>();
    for (const day of round.days) {
      for (const slot of day.slots) map.set(dayStartKey(day.date, slot.startTime), slot);
    }
    return map;
  }, [round.days]);

  const sessionsByCell = useMemo(() => {
    const map = new Map<string, ManualScheduleSession[]>();
    for (const session of sessions) {
      const bucket = map.get(cellKey(session.date, session.slotId)) ?? [];
      bucket.push(session);
      map.set(cellKey(session.date, session.slotId), bucket);
    }
    return map;
  }, [sessions]);

  const groupById = useMemo(() => {
    const map = new Map<string, AttachedRoundGroup>();
    for (const group of attachedGroups ?? []) {
      for (const variant of groupIdVariants(group.groupId)) map.set(variant, group);
    }
    return map;
  }, [attachedGroups]);

  const lecturerById = useMemo(() => {
    const map = new Map<string, RoundInvitation>();
    for (const invitation of invitations ?? []) map.set(String(invitation.lecturer.id), invitation);
    return map;
  }, [invitations]);

  const roomById = useMemo(() => {
    const map = new Map<string, RoomApiItem>();
    for (const room of rooms ?? []) map.set(String(room.id), room);
    return map;
  }, [rooms]);

  const isLoading = groupsLoading || invitationsLoading || roomsLoading;

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-medium">Chưa có lịch xếp tay</p>
        <p className="mt-1 text-sm text-muted-foreground">Mở trang xếp lịch tay để tạo bản nháp trước.</p>
        <Button className="mt-4" size="sm" nativeButton={false} render={<Link href={`/manager/rounds/${roundId}/manual-schedule`} />}>
          <Pencil />
          Xếp lịch
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 w-28 min-w-28 border-r border-b border-border bg-muted px-3 py-3 text-left align-middle text-xs font-semibold text-muted-foreground">
              Timeslot
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="sticky top-0 z-20 min-w-60 border-b border-l border-border bg-muted px-3 py-2 text-left align-middle"
              >
                <span className="block text-[11px] font-medium text-muted-foreground capitalize">
                  {formatDate(date, "dddd")}
                </span>
                <span className="mt-1 block text-sm font-semibold tabular-nums">{formatDate(date, "DD/MM")}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRows.map((row) => (
            <tr key={row.startTime}>
              <th
                scope="row"
                className="sticky left-0 z-10 w-28 min-w-28 border-r border-b border-border bg-background px-3 py-3 text-left align-top"
              >
                <span className="block text-xs font-semibold tabular-nums">{row.startTime}</span>
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground tabular-nums">
                  đến {row.endTime}
                </span>
              </th>
              {dates.map((date) => {
                const slot = slotsByCell.get(dayStartKey(date, row.startTime));
                const cellSessions = slot ? sessionsByCell.get(cellKey(date, slot.id)) ?? [] : [];

                return (
                  <td
                    key={`${date}-${row.startTime}`}
                    className="h-28 min-w-60 border-b border-l border-border p-2 align-top"
                  >
                    {!slot && <span className="text-xs text-muted-foreground">Không mở</span>}
                    {slot && cellSessions.length === 0 && (
                      <span className="text-xs text-muted-foreground/75">Chưa xếp</span>
                    )}
                    {slot && cellSessions.length > 0 && (
                      <div className="space-y-1.5">
                        {cellSessions.map((session) => (
                          <PreviewChip
                            key={session.id}
                            session={session}
                            roleLabelByKey={roleLabelByKey}
                            groupById={groupById}
                            roomById={roomById}
                            lecturerById={lecturerById}
                          />
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
