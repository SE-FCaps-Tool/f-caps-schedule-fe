"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FilePlus2, MoreHorizontal, Search, Upload, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useSemesterContext } from "../../_shared/semester-context";
import { useProjects, useCreateProject, useUpdateProject } from "@/hooks/manager/useProjects";
import { useMajors } from "@/hooks/manager/useLookups";
import { useLecturers } from "@/hooks/manager/useLecturers";
import type { ProjectApiItem } from "@/lib/api/services/fetchProjects";

function notImplemented(action: string) {
  toast.info(`${action} — chưa nối backend`);
}

/** Chọn 1–2 GVHD với đúng 1 MAIN — dùng chung cho form tạo đề tài và gán GVHD */
function SupervisorPicker({
  mainLecturerId,
  coLecturerId,
  onChangeMain,
  onChangeCo,
  showCo = true,
}: {
  mainLecturerId: string;
  coLecturerId: string;
  onChangeMain: (v: string) => void;
  onChangeCo: (v: string) => void;
  showCo?: boolean;
}) {
  const { data: lecturers } = useLecturers();
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>GVHD chính</Label>
        <Select value={mainLecturerId} onValueChange={(v) => v && onChangeMain(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn giảng viên">
              {(v: string) => {
                const l = lecturers?.find((l) => String(l.id) === v);
                return l ? `${l.lecturer_code} — ${l.display_name}` : "Chọn giảng viên";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(lecturers ?? []).map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.lecturer_code} — {l.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showCo && (
        <div className="space-y-1.5">
          <Label>GVHD phụ (tùy chọn)</Label>
          <Select value={coLecturerId} onValueChange={(v) => onChangeCo(!v || v === "__none" ? "" : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Không có">
                {(v: string) => {
                  if (!v || v === "__none") return "Không có";
                  const l = lecturers?.find((l) => String(l.id) === v);
                  return l ? `${l.lecturer_code} — ${l.display_name}` : "Không có";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Không có</SelectItem>
              {(lecturers ?? [])
                .filter((l) => String(l.id) !== mainLecturerId)
                .map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.lecturer_code} — {l.display_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function CreateProjectDialog({
  open,
  onOpenChange,
  semesterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const { data: majors } = useMajors();
  const { data: lecturers } = useLecturers();
  const createProject = useCreateProject();
  const [majorId, setMajorId] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [mainLecturerId, setMainLecturerId] = useState("");
  const [coLecturerId, setCoLecturerId] = useState("");

  function reset() {
    setMajorId("");
    setCode("");
    setTitle("");
    setMainLecturerId("");
    setCoLecturerId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!semesterId || !majorId || !mainLecturerId) return;
    const mainCode = lecturers?.find((l) => String(l.id) === mainLecturerId)?.lecturer_code;
    const coCode = lecturers?.find((l) => String(l.id) === coLecturerId)?.lecturer_code;
    if (!mainCode) return;
    const supervisors = [`${mainCode}:MAIN`, ...(coCode ? [`${coCode}:CO`] : [])];
    createProject.mutate(
      { semester_id: semesterId, major_id: Number(majorId), code, title, supervisors },
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
            <DialogTitle>Tạo đề tài</DialogTitle>
            <DialogDescription>Đề tài mới thuộc học kỳ hiện tại, cần đúng một GVHD chính.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã đề tài</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ngành</Label>
                <Select value={majorId} onValueChange={(v) => v && setMajorId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn ngành">
                      {(v: string) => {
                        const m = majors?.find((m) => String(m.id) === v);
                        return m ? `${m.code} — ${m.name}` : "Chọn ngành";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(majors ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.code} — {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tên đề tài</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <SupervisorPicker
              mainLecturerId={mainLecturerId}
              coLecturerId={coLecturerId}
              onChangeMain={setMainLecturerId}
              onChangeCo={setCoLecturerId}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending || !semesterId || !majorId || !mainLecturerId}>
              {createProject.isPending ? "Đang tạo..." : "Tạo đề tài"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditMode = "info" | "main" | "co";

function EditProjectDialog({
  project,
  mode,
  onOpenChange,
  semesterId,
}: {
  project: ProjectApiItem | null;
  mode: EditMode;
  onOpenChange: (open: boolean) => void;
  semesterId: number | undefined;
}) {
  const updateProject = useUpdateProject();
  const currentMain = project?.supervisors?.find((s) => s.type === "MAIN");
  const currentCo = project?.supervisors?.find((s) => s.type === "CO");
  const { data: lecturers } = useLecturers();
  const initialMainId = lecturers?.find((l) => l.lecturer_code === currentMain?.lecturer_code)?.id;
  const initialCoId = lecturers?.find((l) => l.lecturer_code === currentCo?.lecturer_code)?.id;

  // Khởi tạo state từ project/mode hiện tại — parent key={`${project.id}-${mode}`} nên component
  // remount (state reset) mỗi khi đổi target, không cần useEffect đồng bộ lại.
  const [code, setCode] = useState(project?.code ?? "");
  const [title, setTitle] = useState(project?.title ?? "");
  const [mainLecturerId, setMainLecturerId] = useState(initialMainId ? String(initialMainId) : "");
  const [coLecturerId, setCoLecturerId] = useState(initialCoId ? String(initialCoId) : "");

  if (!project) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    if (mode === "info") {
      updateProject.mutate(
        { projectId: project.id, payload: { code, title }, semesterId },
        { onSuccess: () => onOpenChange(false) }
      );
      return;
    }
    if (!mainLecturerId) return;
    const mainCode = lecturers?.find((l) => String(l.id) === mainLecturerId)?.lecturer_code;
    const coCode = lecturers?.find((l) => String(l.id) === coLecturerId)?.lecturer_code;
    if (!mainCode) return;
    const supervisors = [`${mainCode}:MAIN`, ...(coCode ? [`${coCode}:CO`] : [])];
    updateProject.mutate(
      { projectId: project.id, payload: { supervisors }, semesterId },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const title_ = mode === "info" ? "Chỉnh sửa đề tài" : mode === "main" ? "Gán GVHD chính" : "Gán GVHD phụ";

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title_}</DialogTitle>
            <DialogDescription>{project.code}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === "info" && (
              <>
                <div className="space-y-1.5">
                  <Label>Mã đề tài</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Tên đề tài</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
              </>
            )}
            {(mode === "main" || mode === "co") && (
              <SupervisorPicker
                mainLecturerId={mainLecturerId}
                coLecturerId={coLecturerId}
                onChangeMain={setMainLecturerId}
                onChangeCo={setCoLecturerId}
                showCo={mode === "co" || coLecturerId !== ""}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={updateProject.isPending || (mode !== "info" && !mainLecturerId)}>
              {updateProject.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const { data: projects, isLoading, isError } = useProjects(currentSemester?.id);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ project: ProjectApiItem; mode: EditMode } | null>(null);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.supervisors?.some((s) => s.display_name.toLowerCase().includes(q))
    );
  }, [projects, search]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Đề tài <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{projects ? `${projects.length} đề tài` : "…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => notImplemented("Import đề tài")}>
            <Upload />
            Import
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <FilePlus2 />
            Tạo đề tài
          </Button>
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />
      <EditProjectDialog
        key={editTarget ? `${editTarget.project.id}-${editTarget.mode}` : "none"}
        project={editTarget?.project ?? null}
        mode={editTarget?.mode ?? "info"}
        onOpenChange={(open) => !open && setEditTarget(null)}
        semesterId={currentSemester?.id}
      />

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã, tên đề tài hoặc GVHD..."
          className="pl-9"
        />
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
            Không tải được danh sách đề tài. Thử tải lại trang.
          </div>
        )}
        {projects && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Mã đề tài</TableHead>
                  <TableHead>Tên đề tài</TableHead>
                  <TableHead>GVHD</TableHead>
                  <TableHead>Ngành</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Hành động</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Chưa có đề tài nào khớp tìm kiếm.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((project) => {
                  const main = project.supervisors?.find((s) => s.type === "MAIN");
                  const co = project.supervisors?.find((s) => s.type === "CO");
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{project.code}</TableCell>
                      <TableCell className="max-w-64 truncate font-medium" title={project.title}>
                        {project.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {main
                          ? `${main.display_name}${co ? ` + ${co.display_name}` : ""}`
                          : `${project.supervisor_count} GVHD`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.major_code}</TableCell>
                      <TableCell>
                        <StatusDot
                          tone={project.status === "ACTIVE" ? "sky" : project.status === "COMPLETED" ? "emerald" : "red"}
                          label={
                            project.status === "ACTIVE"
                              ? "Đang triển khai"
                              : project.status === "COMPLETED"
                                ? "Hoàn thành"
                                : "Không đạt"
                          }
                        />
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
                            <DropdownMenuItem onClick={() => setEditTarget({ project, mode: "info" })}>Chỉnh sửa</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTarget({ project, mode: "main" })}>Gán GVHD chính</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTarget({ project, mode: "co" })}>Gán GVHD phụ</DropdownMenuItem>
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
