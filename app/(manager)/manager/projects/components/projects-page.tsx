"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2, Pencil, Search, Upload, WifiOff } from "lucide-react";
import { ImportProjectsDialog } from "@/components/projects/import-projects-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  TOPIC_TYPE_OPTIONS,
  type TopicType,
  topicTypeLabel,
} from "@/lib/utils/masterDataLabels";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import { useAutoPageSize } from "@/hooks/shared/useAutoPageSize";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { normalizeListResponse } from "@/lib/api/pagination";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { usePageState } from "@/hooks/shared/usePageState";


function SupervisorPicker({
  mainLecturerId,
  coLecturerId,
  onChangeMain,
  onChangeCo,
  mainLabel,
  coLabel,
}: {
  mainLecturerId: string;
  coLecturerId: string;
  onChangeMain: (v: string) => void;
  onChangeCo: (v: string) => void;
  /** Nhãn GVHD đang gán sẵn — giữ hiển thị đúng khi search thu hẹp danh sách. */
  mainLabel?: string;
  coLabel?: string;
}) {
  // Mỗi ô một query riêng: search đi xuống BE (`GET /lecturers?search=`) nên tìm được mã
  // giảng viên ở mọi trang, không chỉ 20 dòng đầu đã tải.
  const [mainSearch, setMainSearch] = useState("");
  const [coSearch, setCoSearch] = useState("");
  const main = useLecturersInfinite(mainSearch || undefined);
  const co = useLecturersInfinite(coSearch || undefined);
  const label = (l: LecturerApiItem) => `${l.lecturerCode} — ${l.displayName}`;

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
          onSearchChange={setMainSearch}
          selectedLabelFallback={mainLabel}
          isLoading={main.isLoading}
          isFetchingNextPage={main.isFetchingNextPage}
          placeholder="Chọn giảng viên"
          searchPlaceholder="Tìm theo mã hoặc tên giảng viên..."
          emptyText="Không có giảng viên khớp tìm kiếm."
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
          onSearchChange={setCoSearch}
          selectedLabelFallback={coLabel}
          isLoading={co.isLoading}
          isFetchingNextPage={co.isFetchingNextPage}
          placeholder="Không có"
          searchPlaceholder="Tìm theo mã hoặc tên giảng viên..."
          emptyText="Không có giảng viên khớp tìm kiếm."
        />
      </div>
    </div>
  );
}

function supervisorLabel(s: ProjectListItem["mainSupervisor"]) {
  return s?.code;
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
  const [topicType, setTopicType] = useState<TopicType>("REGULAR");

  function reset() {
    setCode("");
    setNameVi("");
    setNameEn("");
    setMainLecturerId("");
    setCoLecturerId("");
    setTopicType("REGULAR");
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
        topicType,
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
            <div className="space-y-1.5">
              <Label>Loại đề tài</Label>
              <Select value={topicType} onValueChange={(value) => setTopicType(value as TopicType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại đề tài">
                    {(value: TopicType) => topicTypeLabel(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{option.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

/**
 * Dropdown đổi GVHD ngay trong ô bảng — thay cho dialog "Gán GVHD" trước đây (menu "..." đã bỏ).
 * GVHD chính bắt buộc nên không cho chọn về rỗng; GVHD phụ chọn lại chính nó để bỏ trống.
 * Loại đề tài giữ nguyên giá trị hiện có vì BE yêu cầu gửi kèm trong mọi lần PATCH.
 */
function InlineSupervisorCell({ project, role }: { project: ProjectListItem; role: "MAIN" | "CO" }) {
  const updateProject = useUpdateProject();
  const [search, setSearch] = useState("");
  const { items, isLoading, isFetchingNextPage, sentinelRef } = useLecturersInfinite(search || undefined);
  const mainId = toLecturerSelectValue(project.mainSupervisor?.id);
  const coId = toLecturerSelectValue(project.coSupervisor?.id);
  const currentId = role === "MAIN" ? mainId : coId;
  const current = role === "MAIN" ? project.mainSupervisor : project.coSupervisor;

  function handleChange(value: string | null) {
    if (role === "MAIN" && !value) return;
    if ((value ?? "") === currentId) return;
    updateProject.mutate({
      projectId: project.id,
      payload: {
        mainSupervisorId: role === "MAIN" ? (value as string) : mainId,
        coSupervisorId: role === "CO" ? (value ?? undefined) : (coId || undefined),
        topicType: project.topicType,
      },
    });
  }

  return (
    <AsyncCombobox
      value={currentId || null}
      onChange={handleChange}
      items={role === "CO" ? items.filter((l) => String(l.id) !== mainId) : items}
      getId={(l) => String(l.id)}
      getLabel={(l) => `${l.lecturerCode} — ${l.displayName}`}
      getSelectedLabel={(l) => l.lecturerCode}
      sentinelRef={sentinelRef}
      onSearchChange={setSearch}
      selectedLabelFallback={supervisorLabel(current ?? null)}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      placeholder={role === "MAIN" ? "Chọn GVHD" : ""}
      searchPlaceholder="Tìm theo mã hoặc tên..."
      emptyText="Không có giảng viên khớp tìm kiếm."
      triggerIcon={<Pencil className="size-3.5 shrink-0 opacity-60" aria-hidden />}
      disabled={updateProject.isPending}
      className="h-8 w-full justify-center gap-2 rounded-md border-0 bg-transparent px-1 text-center text-xs shadow-none hover:bg-muted/60 focus-visible:ring-2"
    />
  );
}

export function ProjectsPage() {
  const { currentSemesterId, currentSemester } = useSemesterContext();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
          <Button onClick={() => setImportOpen(true)}>
            <Upload />
            Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <FilePlus2 />
            Tạo đề tài
          </Button>
        </div>
      </div>

      <ImportProjectsDialog open={importOpen} onOpenChange={setImportOpen} semesterId={currentSemester?.id} />
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} semesterId={currentSemester?.id} />

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
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-[1446px] table-fixed">
              <colgroup>
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[400px]" />
                <col className="w-[235px]" />
                <col className="w-[235px]" />
                <col className="w-[150px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Mã đề tài</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Tên đề tài</TableHead>
                  <TableHead className="text-center">GVHD 1</TableHead>
                  <TableHead className="text-center">GVHD 2</TableHead>
                  <TableHead className="pr-4">Trạng thái</TableHead>
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
                      <TableCell className="pl-4 font-mono text-xs font-medium">
                        <Link
                          href={`/manager/projects/${project.id}`}
                          className="rounded-sm hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {project.code}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {project.group?.code ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <div>
                                <span className="block truncate font-medium text-foreground">{project.nameEn?.trim() || project.nameVi}</span>
                                <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  {topicTypeLabel(project.topicType)}
                                </span>
                              </div>
                            }
                          />
                          <TooltipContent className="rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                            {project.nameVi}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <InlineSupervisorCell project={project} role="MAIN" />
                      </TableCell>
                      <TableCell className="text-center">
                        <InlineSupervisorCell project={project} role="CO" />
                      </TableCell>
                      <TableCell className="pr-4">
                        <StatusDot tone={stateMeta.tone} label={stateMeta.label} />
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
