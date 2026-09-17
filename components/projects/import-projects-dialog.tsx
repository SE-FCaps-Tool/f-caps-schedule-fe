"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportProjects } from "@/hooks/manager/useProjects";
import type { ProjectImportResponse } from "@/lib/api/services/fetchProjects";

const ERROR_CODE_LABEL: Record<string, string> = {
  REQUIRED_FIELD_MISSING: "Thiếu trường bắt buộc (Mã đề tài, Mã nhóm, tên đề tài hoặc GVHD)",
  GVHD_NOT_FOUND: "Không tìm thấy giảng viên với mã GVHD đã nhập",
  GVHD_DUPLICATE: "GVHD và GVHD2 không được trùng nhau",
  GROUP_CODE_MISMATCH: "Đề tài đã có mã nhóm khác — không thể đổi mã nhóm qua import",
  SEMESTER_NOT_FOUND: "Học kỳ không tồn tại",
  PROJECT_ROW_INVALID: "Dữ liệu dòng không hợp lệ",
  IMPORT_INVALID_FILE: "File không đọc được — chỉ hỗ trợ .xlsx",
  IMPORT_FILE_TOO_LARGE: "File vượt quá giới hạn 5 MB",
};

function friendlyError(code: string, message?: string) {
  return ERROR_CODE_LABEL[code] ?? message ?? code;
}

/**
 * Thông tin cấu trúc cột Excel template.
 * Mỗi cột hiển thị tên cột, ví dụ giá trị và chú thích bắt buộc/tùy chọn.
 */
const TEMPLATE_COLUMNS = [
  {
    header: "Mã đề tài",
    example: "SU26SE094",
    note: "Bắt buộc — trùng mã sẽ cập nhật đề tài đã có, không tạo trùng",
    required: true,
  },
  {
    header: "Mã nhóm",
    example: "GSU26SE01",
    note: "Bắt buộc — mỗi đề tài chỉ có đúng 1 nhóm",
    required: true,
  },
  {
    header: "Tên đề tài Tiếng Việt",
    example: "Hệ thống QL khóa luận",
    note: "Bắt buộc nếu bỏ trống Tiếng Anh/Nhật",
    required: false,
  },
  {
    header: "Tên đề tài Tiếng Anh/ Tiếng Nhật",
    example: "Capstone Scheduler",
    note: "Bắt buộc nếu bỏ trống Tiếng Việt",
    required: false,
  },
  {
    header: "Department",
    example: "SE",
    note: "Mã chuyên ngành — bỏ trống giữ nguyên ngành cũ (đề tài mới thì mặc định SE), tự tạo mã mới nếu chưa có",
    required: false,
  },
  {
    header: "GVHD",
    example: "AnhLT151",
    note: "Mã giảng viên hướng dẫn chính — bắt buộc (dùng GVHD1 nếu có)",
    required: true,
  },
  {
    header: "GVHD2",
    example: "DucDNM2",
    note: "Mã giảng viên hướng dẫn phụ — tùy chọn",
    required: false,
  },
] as const;

function TemplateGuide() {
  const columns = TEMPLATE_COLUMNS;

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border overflow-hidden">
        <Table className="table-fixed min-w-full">
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[130px]" />
            <col />
            <col className="w-[72px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-7 bg-muted/40">
              <TableHead className="h-7 py-1 pl-2.5 text-xs font-medium">Tên cột</TableHead>
              <TableHead className="h-7 py-1 px-2 text-xs font-medium">Ví dụ</TableHead>
              <TableHead className="h-7 py-1 px-2 text-xs font-medium">Chú thích</TableHead>
              <TableHead className="h-7 py-1 pr-2.5 text-center text-xs font-medium">Bắt buộc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((col) => (
              <TableRow key={col.header} className="h-7">
                <TableCell className="py-1 pl-2.5 font-mono text-[11px] font-medium text-foreground whitespace-nowrap">
                  {col.header}
                </TableCell>
                <TableCell className="py-1 px-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap truncate">
                  {col.example}
                </TableCell>
                <TableCell className="py-1 px-2 text-[11px] text-muted-foreground whitespace-nowrap truncate" title={col.note}>
                  {col.note}
                </TableCell>
                <TableCell className="py-1 pr-2.5 text-center">
                  {col.required ? (
                    <Badge variant="default" className="text-[10px] px-1 py-0 h-4 leading-none">Có</Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Dòng đầu là tiêu đề. Trùng mã đề tài sẽ cập nhật đề tài đã có; thiếu thông tin hoặc GVHD không khớp sẽ tự động bỏ qua dòng đó.
      </p>
    </div>
  );
}
function ResultSummary({ result }: { result: ProjectImportResponse }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          <span className="font-medium">{result.created} đề tài đã tạo, {result.updated} đã cập nhật</span>
        </div>
        {result.skipped > 0 && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertCircle className="size-3.5" />
            <span className="font-medium">{result.skipped} dòng bị bỏ qua</span>
          </div>
        )}
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Chi tiết các dòng lỗi</p>
          <div className="max-h-40 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-7">
                  <TableHead className="h-7 py-1 pl-2.5 w-16 text-xs">Dòng</TableHead>
                  <TableHead className="h-7 py-1 px-2 text-xs">Nguyên nhân</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.map((error, index) => (
                  <TableRow key={`${error.row}-${index}`} className="h-7">
                    <TableCell className="py-1 pl-2.5 font-mono text-[11px]">{error.row}</TableCell>
                    <TableCell className="py-1 px-2 text-[11px] text-muted-foreground">
                      {friendlyError(error.code, error.message)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export function ImportProjectsDialog({
  open,
  onOpenChange,
  semesterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProjectImportResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useImportProjects(semesterId);

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleImport() {
    if (!file) return;
    mutate(file, {
      onSuccess: (data) => setResult(data),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[620px] p-4 sm:p-5 gap-3">
        <DialogHeader icon={FileSpreadsheet} iconTone="emerald">
          <DialogTitle className="text-base">Import đề tài từ Excel</DialogTitle>
          <DialogDescription className="text-xs">
            Tải lên file .xlsx để tạo hoặc cập nhật đề tài, nhóm và GVHD hàng loạt cho học kỳ đang chọn.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <TemplateGuide />
            {!semesterId && (
              <p className="text-xs text-destructive">Chưa chọn học kỳ — vui lòng chọn học kỳ trước khi import.</p>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-5 px-4 text-center transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </div>
              {file ? (
                <div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[400px]">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB — Nhấp để đổi file khác
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Kéo thả file vào đây hoặc <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2">chọn file</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Chỉ hỗ trợ định dạng <span className="font-medium text-foreground">.xlsx</span> (tối đa 5MB)
                  </p>
                </div>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <ResultSummary result={result} />
        )}

        <DialogFooter className="pt-1">
          {result ? (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Đóng
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); reset(); }}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleImport} disabled={!file || !semesterId || isPending}>
                <Upload className="size-3.5" />
                {isPending ? "Đang import..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
