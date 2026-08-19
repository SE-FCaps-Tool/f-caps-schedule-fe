"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFENSE_LEVELS, JOURNEY_STATUS_META, type RoundResult, type SupervisedGroup } from "./mock-data";
import { toneBadgeClass } from "./tone";
import { AssignLeaderPopover } from "./assign-leader-popover";

const colDivider = "border-r border-border";

function findRound(rounds: RoundResult[], type: RoundResult["roundType"]) {
  return rounds.find((r) => r.roundType === type);
}

function findNextRound(rounds: RoundResult[]) {
  return rounds.find((r) => r.roundType === "DEFENSE_1_2" || r.roundType === "DEFENSE_2");
}

function ReviewCell({ round }: { round?: RoundResult }) {
  if (!round || round.phaseStatus === "locked") {
    return (
      <>
        <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground/50 tabular-nums")}>—</TableCell>
        <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground/50")}>—</TableCell>
      </>
    );
  }
  const tone = round.reviewOutcome === "Không đạt" ? "red" : round.reviewOutcome === "Cần sửa" ? "amber" : "emerald";
  return (
    <>
      <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground tabular-nums")}>
        {round.date ? formatDate(round.date, "DD/MM") : "—"}
      </TableCell>
      <TableCell className={cn(colDivider, "text-center")}>
        {round.phaseStatus === "completed" && round.reviewOutcome ? (
          <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold text-nowrap", toneBadgeClass[tone])}>
            {round.reviewOutcome}
          </span>
        ) : (
          <span className="text-sm text-primary">Sắp tới</span>
        )}
      </TableCell>
    </>
  );
}

function DefenseCell({ round }: { round?: RoundResult }) {
  if (!round || round.phaseStatus === "locked") {
    return (
      <>
        <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground/50 tabular-nums")}>—</TableCell>
        <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground/50")}>—</TableCell>
      </>
    );
  }
  const meta = round.defenseLevel ? DEFENSE_LEVELS[round.defenseLevel] : undefined;
  return (
    <>
      <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground tabular-nums")}>
        {round.date ? formatDate(round.date, "DD/MM") : "—"}
      </TableCell>
      <TableCell className={cn(colDivider, "text-center")}>
        {round.phaseStatus === "completed" && meta ? (
          <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold text-nowrap", toneBadgeClass[meta.tone])}>
            {meta.label}
          </span>
        ) : (
          <span className="text-sm text-primary">Sắp tới</span>
        )}
      </TableCell>
    </>
  );
}

export function GroupsTable({
  groups,
  onAssignLeader,
}: {
  groups: SupervisedGroup[];
  onAssignLeader: (groupId: string, memberId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table className="min-w-5xl border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead rowSpan={2} className={cn(colDivider, "h-auto text-center align-middle text-sm whitespace-normal")}>
              Nhóm
            </TableHead>
            <TableHead rowSpan={2} className={cn(colDivider, "h-auto text-center align-middle text-sm whitespace-normal")}>
              Đề tài
            </TableHead>
            <TableHead colSpan={2} className={cn(colDivider, "text-center text-sm")}>
              Review 1
            </TableHead>
            <TableHead colSpan={2} className={cn(colDivider, "text-center text-sm")}>
              Review 2
            </TableHead>
            <TableHead colSpan={2} className={cn(colDivider, "text-center text-sm")}>
              Defense 1.1
            </TableHead>
            <TableHead rowSpan={2} className={cn(colDivider, "h-auto text-center align-middle text-sm whitespace-normal")}>
              Đợt tiếp theo
            </TableHead>
            <TableHead rowSpan={2} className={cn(colDivider, "h-auto text-center align-middle text-sm whitespace-normal")}>
              Trạng thái
            </TableHead>
            <TableHead rowSpan={2} className="h-auto text-center align-middle text-sm whitespace-normal">
              Trưởng nhóm
            </TableHead>
          </TableRow>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Ngày</TableHead>
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Kết quả</TableHead>
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Ngày</TableHead>
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Kết quả</TableHead>
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Ngày</TableHead>
            <TableHead className={cn(colDivider, "text-center text-xs font-medium text-muted-foreground")}>Kết luận</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const statusMeta = JOURNEY_STATUS_META[group.currentStatus];
            const review1 = findRound(group.rounds, "REVIEW_1");
            const review2 = findRound(group.rounds, "REVIEW_2");
            const defense11 = findRound(group.rounds, "DEFENSE_1_1");
            const nextRound = findNextRound(group.rounds);
            const leader = group.members.find((m) => m.isLeader);

            return (
              <TableRow key={group.id}>
                <TableCell className={colDivider}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold">{group.code}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {group.myRole === "MAIN" ? "Chính" : "Đồng HD"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className={cn(colDivider, "max-w-56 whitespace-normal text-sm text-muted-foreground")}>
                  {group.titleVi}
                </TableCell>

                <ReviewCell round={review1} />
                <ReviewCell round={review2} />
                <DefenseCell round={defense11} />

                <TableCell className={cn(colDivider, "text-center text-sm whitespace-normal")}>
                  {nextRound ? (
                    <>
                      <span className="block font-medium text-foreground">{nextRound.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {nextRound.date ? formatDate(nextRound.date, "DD/MM") : "Chưa xác định"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <TableCell className={colDivider}>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold text-nowrap", toneBadgeClass[statusMeta.tone])}>
                      {statusMeta.label}
                    </span>
                    {group.remediation?.status === "pending" && (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              aria-label="Xem hạn khắc phục"
                              className="flex size-6 shrink-0 items-center justify-center rounded-full text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                            />
                          }
                        >
                          <AlertTriangle className="size-4" />
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-64 p-3">
                          <p className="text-sm font-medium">Hạn khắc phục Defense 1.1</p>
                          <p className="mt-1 text-sm tabular-nums">{formatDate(group.remediation.dueDate, "dddd, DD/MM/YYYY")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Người xác nhận: {group.remediation.verifier.name} · {group.remediation.verifier.code}
                          </p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {leader ? (
                    <>
                      <span className="block truncate text-sm font-medium">{leader.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {group.members.length}/{group.maxMembers} thành viên
                      </span>
                    </>
                  ) : (
                    <AssignLeaderPopover members={group.members} onAssign={(memberId) => onAssignLeader(group.id, memberId)} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
