"use client";

import { useState } from "react";
import { AlertTriangle, Crown, FolderKanban, MoreHorizontal, Search, UserMinus, UsersRound, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusDot } from "../../_shared/status-dot";
import { GROUP_STATUS_META, PROJECT_STATUS_META, type ProjectProgressState } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import {
  useGroups,
  useCreateGroup,
  useGroupMembers,
  useChangeGroupLeader,
  useGroupMemberLeave,
  useAssignGroupProject,
} from "@/hooks/manager/useGroups";
import { useProjects } from "@/hooks/manager/useProjects";
import { useStudents } from "@/hooks/manager/useLookups";
import type { GroupListItem } from "@/lib/api/services/fetchGroups";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { usePageState } from "@/hooks/shared/usePageState";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function CreateGroupDialog({
  open,
  onOpenChange,
  semesterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: students } = useStudents();
  const createGroup = useCreateGroup(semesterId);
  const [code, setCode] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState("");
  const [pickerValue, setPickerValue] = useState("");

  function reset() {
    setCode("");
    setStudentIds([]);
    setLeaderId("");
    setPickerValue("");
  }

  function addStudent(id: string) {
    if (!id || studentIds.includes(id)) return;
    setStudentIds((prev) => [...prev, id]);
  }

  function removeStudent(id: string) {
    setStudentIds((prev) => prev.filter((s) => s !== id));
    if (leaderId === id) setLeaderId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || studentIds.length === 0) return;
    createGroup.mutate(
      { code, studentIds, leaderId: leaderId || undefined },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  const available = (students ?? []).filter((s) => !studentIds.includes(String(s.id)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UsersRound} iconTone="sky">
            <DialogTitle>Tạo nhóm</DialogTitle>
            <DialogDescription>Gắn đề tài sau, ở bước riêng.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Mã nhóm</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Thành viên</Label>
              <Select
                value={pickerValue}
                onValueChange={(v) => {
                  if (!v) return;
                  addStudent(v);
                  setPickerValue("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="+ Thêm sinh viên" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.student_code}
                      {s.full_name && ` — ${s.full_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 space-y-1.5">
                {studentIds.map((id) => {
                  const s = students?.find((s) => String(s.id) === id);
                  return (
                    <div key={id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-1.5 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">{s?.student_code ?? id}</span>
                        {s?.full_name && <span className="text-muted-foreground"> — {s.full_name}</span>}
                        {s?.email && <span className="block truncate text-xs text-muted-foreground">{s.email}</span>}
                      </span>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeStudent(id)}>
                        ×
                      </Button>
                    </div>
                  );
                })}
                {studentIds.length === 0 && <p className="text-xs text-muted-foreground">Chưa có thành viên nào.</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Leader (tùy chọn)</Label>
              <Select value={leaderId} onValueChange={(v) => setLeaderId(v ?? "")} disabled={studentIds.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn leader">
                    {(v: string) => {
                      const s = students?.find((s) => String(s.id) === v);
                      if (!s) return "Chọn leader";
                      return s.full_name ? `${s.student_code} — ${s.full_name}` : s.student_code;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {studentIds.map((id) => {
                    const s = students?.find((s) => String(s.id) === id);
                    return (
                      <SelectItem key={id} value={id}>
                        {s?.student_code ?? id}
                        {s?.full_name && ` — ${s.full_name}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createGroup.isPending || !code.trim() || studentIds.length === 0}>
              {createGroup.isPending ? "Đang tạo..." : "Tạo nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetLeaderDialog({ group, onOpenChange }: { group: GroupListItem | null; onOpenChange: (open: boolean) => void }) {
  const { data: members, isLoading } = useGroupMembers(group?.id ?? null);
  const changeLeader = useChangeGroupLeader();
  const [leaderId, setLeaderId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !leaderId || !reason.trim()) return;
    changeLeader.mutate(
      { groupId: group.id, payload: { leaderId, reason } },
      {
        onSuccess: () => {
          setLeaderId("");
          setReason("");
          onOpenChange(false);
        },
      }
    );
  }

  const activeMembers = (members ?? []).filter((m) => m.status === "ACTIVE");

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={Crown} iconTone="amber">
            <DialogTitle>Gán/đổi Leader</DialogTitle>
            <DialogDescription>{group?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Thành viên</Label>
              <Select value={leaderId} onValueChange={(v) => v && setLeaderId(v)} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn thành viên"}>
                    {(v: string) => {
                      const m = activeMembers.find((m) => m.studentId === v);
                      return m ? `${m.studentCode} — ${m.fullName}${m.role === "LEADER" ? " (Leader hiện tại)" : ""}` : "Chọn thành viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => (
                    <SelectItem key={m.membershipId} value={m.studentId}>
                      {m.studentCode} — {m.fullName} {m.role === "LEADER" ? "(Leader hiện tại)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={changeLeader.isPending || !leaderId || !reason.trim()}>
              {changeLeader.isPending ? "Đang lưu..." : "Cập nhật Leader"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberLeaveDialog({ group, onOpenChange }: { group: GroupListItem | null; onOpenChange: (open: boolean) => void }) {
  const { data: members, isLoading } = useGroupMembers(group?.id ?? null);
  const memberLeave = useGroupMemberLeave();
  const [membershipId, setMembershipId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !membershipId || !reason.trim()) return;
    memberLeave.mutate(
      { groupId: group.id, membershipId, payload: { effectiveDate: today(), reason } },
      {
        onSuccess: () => {
          setMembershipId("");
          setReason("");
          onOpenChange(false);
        },
      }
    );
  }

  const activeMembers = (members ?? []).filter((m) => m.status === "ACTIVE");

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UserMinus} iconTone="destructive">
            <DialogTitle>Đánh dấu sinh viên rời nhóm</DialogTitle>
            <DialogDescription>{group?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Thành viên</Label>
              <Select value={membershipId} onValueChange={(v) => v && setMembershipId(v)} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn thành viên"}>
                    {(v: string) => {
                      const m = activeMembers.find((m) => m.membershipId === v);
                      return m ? `${m.studentCode} — ${m.fullName}` : "Chọn thành viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => (
                    <SelectItem key={m.membershipId} value={m.membershipId}>
                      {m.studentCode} — {m.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={memberLeave.isPending || !membershipId || !reason.trim()}>
              {memberLeave.isPending ? "Đang lưu..." : "Đánh dấu rời nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignProjectDialog({
  group,
  onOpenChange,
  semesterId,
}: {
  group: GroupListItem | null;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: projectsResult } = useProjects(semesterId, { hasGroup: false });
  const assignProject = useAssignGroupProject();
  const [projectId, setProjectId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !projectId) return;
    assignProject.mutate(
      { groupId: group.id, payload: { projectId } },
      {
        onSuccess: () => {
          setProjectId("");
          onOpenChange(false);
        },
      }
    );
  }

  const projects = projectsResult?.data ?? [];

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={FolderKanban} iconTone="violet">
            <DialogTitle>Gắn đề tài</DialogTitle>
            <DialogDescription>{group?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Đề tài</Label>
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn đề tài">
                    {(v: string) => {
                      const p = projects.find((p) => p.id === v);
                      return p ? `${p.code} — ${p.nameVi}` : "Chọn đề tài";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.nameVi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={assignProject.isPending || !projectId}>
              {assignProject.isPending ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GroupsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [leaderTarget, setLeaderTarget] = useState<GroupListItem | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<GroupListItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<GroupListItem | null>(null);
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = usePageState(debouncedSearch, pageSize);

  const { data: groupsResult, isLoading, isError } = useGroups(currentSemester?.id, {
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });

  const { items: filtered, meta } = groupsResult
    ? normalizeListResponse(groupsResult, { page, pageSize })
    : { items: [] as GroupListItem[], meta: null };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nhóm sinh viên <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta ? `${meta.total} nhóm` : "…"}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UsersRound />
          Tạo nhóm
        </Button>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />
      <SetLeaderDialog group={leaderTarget} onOpenChange={(open) => !open && setLeaderTarget(null)} />
      <MemberLeaveDialog group={leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)} />
      <AssignProjectDialog group={assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)} semesterId={currentSemester?.id} />

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã nhóm hoặc đề tài..." className="pl-9" />
      </div>

      <div ref={containerRef} className="mt-4">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách nhóm. Thử tải lại trang.
          </div>
        )}
        {groupsResult && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nhóm</TableHead>
                  <TableHead>Đề tài</TableHead>
                  <TableHead className="text-right">Thành viên</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cảnh báo</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Hành động</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Chưa có nhóm nào khớp tìm kiếm.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((group) => {
                  const stateMeta = GROUP_STATUS_META[group.status];
                  const projectStateMeta = group.project
                    ? PROJECT_STATUS_META[group.project.status as ProjectProgressState]
                    : null;
                  return (
                    <TableRow key={group.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{group.code}</TableCell>
                      <TableCell className="text-xs">
                        {group.project && projectStateMeta ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-muted-foreground">{group.project.code}</span>
                            <StatusDot tone={projectStateMeta.tone} label={projectStateMeta.label} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${group.memberCount < 4 ? "font-medium text-amber-600 dark:text-amber-400" : ""}`}>
                        {group.memberCount}
                      </TableCell>
                      <TableCell>
                        {group.leader ? (
                          <span className="text-muted-foreground">{group.leader.fullName}</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Chưa có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={stateMeta.tone} label={stateMeta.label} />
                      </TableCell>
                      <TableCell>
                        {group.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            {group.warnings.map((w) => w.message).join("; ")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Hành động">
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setAssignTarget(group)} disabled={group.status === "DISBANDED"}>
                              Gắn đề tài
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLeaderTarget(group)}>Gán/đổi Leader</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLeaveTarget(group)}>Đánh dấu rời nhóm</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {meta && <DataTablePagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
