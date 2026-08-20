"use client";

import { AlertTriangle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ReviewResult, DefenseResult } from "@/lib/api/services/fetchResults";
import type { SupervisedProject } from "@/lib/api/services/fetchLecturerPortal";
import {
  ROUND_TYPE_LABEL,
  PROJECT_STATUS_META,
  REVIEW_RESULT_META,
  DEFENSE_RESULT_META,
  REMEDIATION_STATUS_META,
} from "../../_shared/labels";
import { toneBadgeClass } from "./tone";

const colDivider = "border-r border-border";

function LatestResultCell({ result }: { result: SupervisedProject["latestResult"] }) {
  if (!result) {
    return <TableCell className={cn(colDivider, "text-center text-sm text-muted-foreground/50")}>—</TableCell>;
  }
  const meta =
    result.kind === "REVIEW"
      ? REVIEW_RESULT_META[result.value as ReviewResult]
      : DEFENSE_RESULT_META[result.value as DefenseResult];
  return (
    <TableCell className={colDivider}>
      <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold text-nowrap", toneBadgeClass[meta.tone])}>
        {meta.label}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {ROUND_TYPE_LABEL[result.roundType]} · {formatDate(result.date, "DD/MM")}
      </span>
    </TableCell>
  );
}

export function GroupsTable({ projects }: { projects: SupervisedProject[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table className="min-w-4xl border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(colDivider, "text-sm")}>Nhóm / Đề tài</TableHead>
            <TableHead className={cn(colDivider, "text-sm")}>Trưởng nhóm</TableHead>
            <TableHead className={cn(colDivider, "text-center text-sm")}>Trạng thái</TableHead>
            <TableHead className={cn(colDivider, "text-sm")}>Đợt tiếp theo</TableHead>
            <TableHead className={cn(colDivider, "text-sm")}>Kết quả gần nhất</TableHead>
            <TableHead className="text-sm">Khắc phục</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const statusMeta = PROJECT_STATUS_META[project.projectStatus] ?? {
              label: project.projectStatus ?? "Không rõ",
              tone: "neutral" as const,
            };
            const leader = project.group?.leader ?? null;
            const members = project.group?.members ?? [];

            return (
              <TableRow key={project.id}>
                <TableCell className={colDivider}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold">{project.group?.code ?? "—"}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {project.supervisorRole === "MAIN" ? "Chính" : "Đồng HD"}
                    </span>
                  </div>
                  <p className="mt-0.5 max-w-72 truncate text-sm text-muted-foreground">{project.titleVi}</p>
                </TableCell>

                <TableCell className={colDivider}>
                  {leader ? (
                    <span className="block truncate text-sm font-medium">{leader.name}</span>
                  ) : (
                    <span className="block text-sm text-muted-foreground">Chưa có trưởng nhóm</span>
                  )}
                  {members.length > 0 ? (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          />
                        }
                      >
                        {leader && `${leader.code} · `}
                        {project.group?.memberCount ?? 0} thành viên
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="w-64 p-3">
                        <p className="text-sm font-medium">Thành viên nhóm</p>
                        <ul className="mt-2 space-y-1.5">
                          {members.map((member) => (
                            <li key={member.id} className="flex items-center gap-1.5">
                              {member.role === "LEADER" ? (
                                <Crown className="size-3.5 shrink-0 text-primary" />
                              ) : (
                                <span className="size-3.5 shrink-0" />
                              )}
                              <span
                                className={cn(
                                  "truncate text-sm",
                                  member.status === "DROPPED" ? "text-muted-foreground line-through" : "text-foreground"
                                )}
                              >
                                {member.name}
                              </span>
                              <span className="text-xs text-muted-foreground">{member.code}</span>
                            </li>
                          ))}
                        </ul>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {leader && `${leader.code} · `}
                      {project.group?.memberCount ?? 0} thành viên
                    </span>
                  )}
                </TableCell>

                <TableCell className={cn(colDivider, "text-center")}>
                  <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold text-nowrap", toneBadgeClass[statusMeta.tone])}>
                    {statusMeta.label}
                  </span>
                </TableCell>

                <TableCell className={cn(colDivider, "text-sm whitespace-normal")}>
                  {project.nextEvaluation ? (
                    <>
                      <span className="block font-medium text-foreground">
                        {ROUND_TYPE_LABEL[project.nextEvaluation.roundType]}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {project.nextEvaluation.date ? formatDate(project.nextEvaluation.date, "DD/MM") : "Chưa xác định"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <LatestResultCell result={project.latestResult} />

                <TableCell>
                  {project.remediation ? (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                              toneBadgeClass[REMEDIATION_STATUS_META[project.remediation.status].tone]
                            )}
                          />
                        }
                      >
                        <AlertTriangle className="size-3.5" />
                        {REMEDIATION_STATUS_META[project.remediation.status].label}
                      </PopoverTrigger>
                      <PopoverContent side="top" align="start" className="w-64 p-3">
                        <p className="text-sm font-medium">Hạn khắc phục</p>
                        <p className="mt-1 text-sm tabular-nums">{formatDate(project.remediation.deadline, "dddd, DD/MM/YYYY")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Người xác nhận: {project.remediation.verifierName}
                        </p>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
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
