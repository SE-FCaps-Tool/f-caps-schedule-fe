"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FilePlus2, MoreHorizontal, Pencil, Search, Upload, UserRoundPlus, WifiOff } from "lucide-react";
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
import { AsyncCombobox } from "@/components/shared/async-combobox";
import { StatusDot } from "../../_shared/status-dot";
import { PROJECT_STATUS_META, type ProjectProgressState } from "../../_shared/labels";
import { useSemesterContext } from "../../_shared/semester-context";
import { useProjects, useCreateProject, useUpdateProject } from "@/hooks/manager/useProjects";
import { useLecturersInfinite } from "@/hooks/manager/useLecturers";
import type { ProjectListItem } from "@/lib/api/services/fetchProjects";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { usePageState } from "@/hooks/shared/usePageState";

function notImplemented(action: string) {
  toast.info(`${action} — chưa có trong spec BE, cần chốt endpoint`);
}

function SupervisorPicker({
  mainLecturerId,
  coLecturerId,
  onChangeMain,
  onChangeCo,
}: {
  mainLecturerId: string;
  coLecturerId: string;
  onChangeMain: (v: string) => void;
  onChangeCo: (v: string) => void;
}) {
  const main = useLecturersInfinite();
  const co = useLecturersInfinite();
  const label = (l: LecturerApiItem) => `${l.lecturer_code} — ${l.display_name}`;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>GVHD chính</Label>
        <AsyncCombobox
          value={mainLecturerId || null}
          onChange={(v) => onChangeMain(v ?? "")}
          items={main.items}
          getId={(l) => String(l.id)}
          getLabel={label}
          sentinelRef={main.sentinelRef}
          isLoading={main.isLoading}
          isFetchingNextPage={main.isFetchingNextPage}
          placeholder="Chọn giảng viên"
          searchPlaceholder="Tìm giảng viên..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>GVHD phụ (tùy chọn)</Label>
        <AsyncCombobox
          value={coLecturerId || null}
          onChange={(v) => onChangeCo(v ?? "")}
          items={co.items.filter((l) => String(l.id) !== mainLecturerId)}
          getId={(l) => String(l.id)}
          getLabel={label}
          sentinelRef={co.sentinelRef}
          isLoading={co.isLoading}
          isFetchingNextPage={co.isFetchingNextPage}
          placeholder="Không có"
          searchPlaceholder="Tìm giảng viên..."
        />
      </div>
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
  const createProject = useCreateProject(semesterId);
  const [code, setCode] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [mainLecturerId, setMainLecturerId] = useState("");
  const [coLecturerId, setCoLecturerId] = useState("");

  function reset() {
    setCode("");
    setNameVi("");
    setNameEn("");
    setMainLecturerId("");
    setCoLecturerId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!semesterId || !code.trim() || !nameVi.trim() || !mainLecturerId) return;
    createProject.mutate(
      {
        code,
        nameVi,
        nameEn: nameEn.trim() || undefined,
        mainSupervisorId: mainLecturerId,
        coSupervisorId: coLecturerId || undefined,
      },
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
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={FilePlus2} iconTone="violet">
            <DialogTitle>Tạo đề tài</DialogTitle>
            <DialogDescription>Đề tài mới thuộc học kỳ hiện tại, cần đúng một GVHD chính. Trạng thái khởi tạo: Nháp.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Mã đề tài</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tên đề tài (Tiếng Việt)</Label>
              <Input value={nameVi} onChange={(e) => setNameVi(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tên đề tài (Tiếng Anh, tùy chọn)</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
            <SupervisorPicker
              mainLecturerId={mainLecturerId}
              coLecturerId={coLecturerId}
              onChangeMain={setMainLecturerId}
              onChangeCo={setCoLecturerId}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending || !semesterId || !code.trim() || !nameVi.trim() || !mainLecturerId}>
              {createProject.isPending ? "Đang tạo..." : "Tạo đề tài"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toLecturerSelectValue(id: string | undefined) {
  return id?.replace(/^lec_/i, "") ?? "";
}

function EditProjectSupervisorsDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateProject = useUpdateProject();
  const [mainLecturerId, setMainLecturerId] = useState(() => toLecturerSelectValue(project?.mainSupervisor?.id));
  const [coLecturerId, setCoLecturerId] = useState(() => toLecturerSelectValue(project?.coSupervisor?.id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !mainLecturerId) return;
    updateProject.mutate(
      {
        projectId: project.id,
        payload: {
          mainSupervisorId: mainLecturerId,
          coSupervisorId: coLecturerId || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UserRoundPlus} iconTone="sky">
            <DialogTitle>Gán giảng viên cho đề tài</DialogTitle>
            <DialogDescription>
              {project ? `${project.code} — ${project.nameVi}` : "Chọn giảng viên hướng dẫn chính và phụ."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SupervisorPicker
              mainLecturerId={mainLecturerId}
              coLecturerId={coLecturerId}
              onChangeMain={setMainLecturerId}
              onChangeCo={setCoLecturerId}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateProject.isPending || !project || !mainLecturerId}>
              {updateProject.isPending ? "Đang lưu..." : "Lưu GVHD"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);
  const { containerRef, pageSize } = useAutoPageSize();
  const [page, setPage] = usePageState(debouncedSearch, pageSize);

  const { data: projectsResult, isLoading, isError } = useProjects(currentSemester?.id, {
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });

  const { items: filtered, meta } = projectsResult
    ? normalizeListResponse(projectsResult, { page, pageSize })
    : { items: [] as ProjectListItem[], meta: null };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Đề tài <span className="font-normal text-muted-foreground">— {currentSemesterId}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta ? `${meta.total} đề tài` : "…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => notImplemented("Import đề tài")}>
            <Upload />
            Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <FilePlus2 />
            Tạo đề tài
          </Button>
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />
      <EditProjectSupervisorsDialog
        key={editingProject?.id ?? "no-project"}
        project={editingProject}
        open={editingProject !== null}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
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
            Không tải được danh sách đề tài. Thử tải lại trang.
          </div>
        )}
        {projectsResult && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Mã đề tài</TableHead>
                  <TableHead>Tên đề tài</TableHead>
                  <TableHead>GVHD</TableHead>
                  <TableHead>Nhóm</TableHead>
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
                  const stateMeta = PROJECT_STATUS_META[project.status as ProjectProgressState];
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="pl-4 p-0">
                        <Link href={`/manager/projects/${project.id}`} className="block px-4 py-2 font-mono text-xs font-medium">
                          {project.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-64 truncate font-medium" title={project.nameVi}>
                        {project.nameVi}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.mainSupervisor
                          ? `${project.mainSupervisor.fullName}${project.coSupervisor ? ` + ${project.coSupervisor.fullName}` : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{project.group?.code ?? "—"}</TableCell>
                      <TableCell>
                        <StatusDot tone={stateMeta.tone} label={stateMeta.label} />
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
                            <DropdownMenuItem onClick={() => setEditingProject(project)}>
                              <Pencil />
                              Gán GVHD
                            </DropdownMenuItem>
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
