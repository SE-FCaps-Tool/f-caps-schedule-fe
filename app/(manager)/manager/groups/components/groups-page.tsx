"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, MoreHorizontal, Search, UsersRound, WifiOff } from "lucide-react";
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
import { GROUP_PROGRESS_META, type GroupProgressState } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useGroups, useCreateGroup, useGroupDetail, useSetGroupLeader, useDropGroupMember } from "@/hooks/manager/useGroups";
import { useProjects } from "@/hooks/manager/useProjects";
import type { GroupApiItem, GroupMemberPayload } from "@/lib/api/services/fetchGroups";

function notImplemented(action: string) {
  toast.info(`${action} — chưa nối backend`);
}

function groupWarning(activeMembers: number, leaderCount: number): string | null {
  if (leaderCount === 0) return "Chưa có Leader";
  if (activeMembers < 4) return "Dưới 4 thành viên";
  return null;
}

const EMPTY_MEMBER: GroupMemberPayload = { student_code: "", role: "MEMBER" };

function CreateGroupDialog({
  open,
  onOpenChange,
  semesterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: projects } = useProjects(semesterId);
  const createGroup = useCreateGroup();
  const [projectId, setProjectId] = useState("");
  const [code, setCode] = useState("");
  const [members, setMembers] = useState<GroupMemberPayload[]>([
    { student_code: "", role: "LEADER" },
    { ...EMPTY_MEMBER },
    { ...EMPTY_MEMBER },
    { ...EMPTY_MEMBER },
  ]);

  function reset() {
    setProjectId("");
    setCode("");
    setMembers([{ student_code: "", role: "LEADER" }, { ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }]);
  }

  function updateMemberCode(index: number, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, student_code: value } : m)));
  }

  function setLeaderIndex(index: number) {
    setMembers((prev) => prev.map((m, i) => ({ ...m, role: i === index ? "LEADER" : "MEMBER" })));
  }

  function addMemberRow() {
    if (members.length >= 5) return;
    setMembers((prev) => [...prev, { ...EMPTY_MEMBER }]);
  }

  function removeMemberRow(index: number) {
    if (members.length <= 4) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  const trimmedCodes = members.map((m) => m.student_code.trim().toUpperCase()).filter(Boolean);
  const duplicateCodes = new Set(trimmedCodes.filter((c, i) => trimmedCodes.indexOf(c) !== i));
  const hasDuplicates = duplicateCodes.size > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || hasDuplicates) return;
    createGroup.mutate(
      { project_id: Number(projectId), code, members },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo nhóm</DialogTitle>
            <DialogDescription>4–5 thành viên, đúng một Leader.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã nhóm</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Đề tài</Label>
                <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn đề tài">
                      {(v: string) => {
                        const p = projects?.find((p) => String(p.id) === v);
                        return p ? `${p.code} — ${p.title}` : "Chọn đề tài";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.code} — {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Thành viên (chọn radio để đặt Leader)</Label>
              <div className="space-y-2">
                {members.map((member, index) => {
                  const normalized = member.student_code.trim().toUpperCase();
                  const isDuplicate = normalized !== "" && duplicateCodes.has(normalized);
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="leader"
                          checked={member.role === "LEADER"}
                          onChange={() => setLeaderIndex(index)}
                          aria-label={`Đặt thành viên ${index + 1} làm Leader`}
                          className="size-4"
                        />
                        <Input
                          value={member.student_code}
                          onChange={(e) => updateMemberCode(index, e.target.value)}
                          placeholder="Mã sinh viên"
                          aria-invalid={isDuplicate}
                          required
                        />
                        <span className="w-14 shrink-0 text-xs text-muted-foreground">
                          {member.role === "LEADER" ? "Leader" : "Thành viên"}
                        </span>
                        {members.length > 4 && (
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeMemberRow(index)}>
                            ×
                          </Button>
                        )}
                      </div>
                      {isDuplicate && <p className="mt-1 ml-6 text-xs text-destructive">Mã sinh viên bị lặp lại</p>}
                    </div>
                  );
                })}
              </div>
              {members.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={addMemberRow}>
                  + Thêm thành viên
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createGroup.isPending || !projectId || hasDuplicates}>
              {createGroup.isPending ? "Đang tạo..." : "Tạo nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetLeaderDialog({
  group,
  onOpenChange,
  semesterId,
}: {
  group: GroupApiItem | null;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: detail, isLoading } = useGroupDetail(group?.id ?? null, semesterId);
  const setLeader = useSetGroupLeader();
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !studentId || !reason.trim()) return;
    setLeader.mutate(
      { groupId: group.id, payload: { student_id: Number(studentId), reason } },
      {
        onSuccess: () => {
          setStudentId("");
          setReason("");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gán/đổi Leader</DialogTitle>
            <DialogDescription>{group?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Thành viên</Label>
              <Select value={studentId} onValueChange={(v) => v && setStudentId(v)} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn thành viên"}>
                    {(v: string) => {
                      const m = detail?.members.find((m) => String(m.student_id) === v);
                      return m ? `${m.student_code} — ${m.display_name}${m.role === "LEADER" ? " (Leader hiện tại)" : ""}` : "Chọn thành viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(detail?.members ?? [])
                    .filter((m) => m.status === "ACTIVE")
                    .map((m) => (
                      <SelectItem key={m.student_id} value={String(m.student_id)}>
                        {m.student_code} — {m.display_name} {m.role === "LEADER" ? "(Leader hiện tại)" : ""}
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
            <Button type="submit" disabled={setLeader.isPending || !studentId || !reason.trim()}>
              {setLeader.isPending ? "Đang lưu..." : "Cập nhật Leader"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DropMemberDialog({
  group,
  onOpenChange,
  semesterId,
}: {
  group: GroupApiItem | null;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: detail, isLoading } = useGroupDetail(group?.id ?? null, semesterId);
  const dropMember = useDropGroupMember();
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !studentId || !reason.trim()) return;
    dropMember.mutate(
      { groupId: group.id, studentId: Number(studentId), payload: { reason } },
      {
        onSuccess: () => {
          setStudentId("");
          setReason("");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Đánh dấu sinh viên rời nhóm</DialogTitle>
            <DialogDescription>{group?.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Thành viên</Label>
              <Select value={studentId} onValueChange={(v) => v && setStudentId(v)} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn thành viên"}>
                    {(v: string) => {
                      const m = detail?.members.find((m) => String(m.student_id) === v);
                      return m ? `${m.student_code} — ${m.display_name}` : "Chọn thành viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(detail?.members ?? [])
                    .filter((m) => m.status === "ACTIVE")
                    .map((m) => (
                      <SelectItem key={m.student_id} value={String(m.student_id)}>
                        {m.student_code} — {m.display_name}
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
            <Button type="submit" variant="destructive" disabled={dropMember.isPending || !studentId || !reason.trim()}>
              {dropMember.isPending ? "Đang lưu..." : "Đánh dấu rời nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GroupsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: groups, isLoading, isError } = useGroups(currentSemester?.id);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [leaderTarget, setLeaderTarget] = useState<GroupApiItem | null>(null);
  const [dropTarget, setDropTarget] = useState<GroupApiItem | null>(null);

  const filtered = useMemo(() => {
    if (!groups) return [];
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.code.toLowerCase().includes(q) || g.project_code.toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nhóm sinh viên <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{groups ? `${groups.length} nhóm` : "…"}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UsersRound />
          Tạo nhóm
        </Button>
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />
      <SetLeaderDialog group={leaderTarget} onOpenChange={(open) => !open && setLeaderTarget(null)} semesterId={currentSemester?.id} />
      <DropMemberDialog group={dropTarget} onOpenChange={(open) => !open && setDropTarget(null)} semesterId={currentSemester?.id} />

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã nhóm hoặc đề tài..." className="pl-9" />
      </div>

      <div className="mt-4">
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
        {groups && (
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
                  const stateMeta = GROUP_PROGRESS_META[group.status as GroupProgressState] ?? {
                    label: group.status,
                    tone: "neutral" as const,
                  };
                  const warning = groupWarning(group.active_member_count, group.leader_count);
                  return (
                    <TableRow key={group.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{group.code}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{group.project_code}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${group.active_member_count < 4 ? "font-medium text-amber-600 dark:text-amber-400" : ""}`}
                      >
                        {group.active_member_count}
                      </TableCell>
                      <TableCell>
                        {group.leader_name ? (
                          <span className="text-muted-foreground">{group.leader_name}</span>
                        ) : group.leader_count > 0 ? (
                          <span className="text-muted-foreground">{group.leader_count} leader</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Chưa có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={stateMeta.tone} label={stateMeta.label} />
                      </TableCell>
                      <TableCell>
                        {warning ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            {warning}
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
                            <DropdownMenuItem
                              render={<Link href={`/manager/progress?group=${encodeURIComponent(group.code)}`} />}
                            >
                              Xem tiến độ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => notImplemented("Thêm sinh viên")}>Thêm sinh viên</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLeaderTarget(group)}>Gán/đổi Leader</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDropTarget(group)}>Đánh dấu rời nhóm</DropdownMenuItem>
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
      </div>
    </div>
  );
}
