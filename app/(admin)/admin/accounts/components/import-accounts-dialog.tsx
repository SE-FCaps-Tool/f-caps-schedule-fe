"use client";

import { useRef, useState } from "react";
import { Copy, FileSpreadsheet, TriangleAlert, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
import { useImportAccounts } from "@/hooks/admin/useAccounts";
import type { AccountImportResponse } from "@/lib/api/services/fetchAccounts";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { seniorityLabel } from "@/lib/utils/masterDataLabels";

const TEMPLATE_COLUMNS = [
  { header: "Email", example: "nam.nguyen@fe.edu.vn", note: "Bắt buộc, duy nhất", required: true },
  { header: "Họ và tên", example: "Nguyễn Thành Nam", note: "Bắt buộc", required: true },
  { header: "Vai trò", example: "LECTURER", note: "ADMIN / MANAGER / LECTURER / STUDENT", required: true },
  { header: "Mã số", example: "NAMNT / SE160001", note: "Bắt buộc đối với Giảng viên / Sinh viên", required: false },
  { header: "Mức độ kinh nghiệm", example: "Senior", note: "Senior / MidLevel / Junior / Rookie (chỉ GV)", required: false },
  { header: "Mật khẩu", example: "Mật khẩu123", note: "Tùy chọn (để trống sẽ tự sinh ngẫu nhiên)", required: false },
] as const;

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Đã sao chép vào clipboard");
  } catch {
    toast.error("Không sao chép được — trình duyệt chặn quyền truy cập");
  }
}

function TemplateGuide() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Cấu trúc các cột trong file Excel:</p>

      <div className="rounded-md border border-border overflow-hidden">
        <Table className="table-fixed min-w-full">
          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[140px]" />
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
            {TEMPLATE_COLUMNS.map((col) => (
              <TableRow key={col.header} className="h-7">
                <TableCell className="py-1 pl-2.5 font-medium text-xs text-foreground whitespace-nowrap">
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
        Hệ thống tự động bỏ qua dòng trống hoặc email/mã số đã tồn tại.
      </p>
    </div>
  );
}

function ResultSummary({ result }: { result: AccountImportResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="size-4" />
          <span>{result.created} tài khoản đã tạo thành công</span>
        </div>
        {result.skipped > 0 && (
          <div className="flex items-center gap-1 text-destructive font-medium">
            <AlertCircle className="size-4" />
            <span>{result.skipped} dòng bị bỏ qua</span>
          </div>
        )}
      </div>

      {result.accounts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Danh sách tài khoản & mật khẩu tạm thời</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() =>
                copyToClipboard(
                  result.accounts
                    .map((a) => `${a.email}\t${a.displayName}\t${a.role}\t${a.code ?? ""}\t${a.tempPassword}`)
                    .join("\n")
                )
              }
            >
              <Copy className="size-3.5" />
              Sao chép tất cả
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            Lưu ý: Hãy sao chép danh sách mật khẩu tạm thời này để gửi cho người dùng. Mật khẩu sẽ không hiển thị lại sau khi đóng hộp thoại.
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-7 bg-muted/40">
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Họ tên</TableHead>
                  <TableHead className="text-xs">Vai trò</TableHead>
                  <TableHead className="text-xs">Mã</TableHead>
                  <TableHead className="text-xs">Mật khẩu tạm</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.accounts.map((acc, index) => (
                  <TableRow key={`${acc.email}-${index}`} className="h-8">
                    <TableCell className="py-1 text-xs font-medium">{acc.email}</TableCell>
                    <TableCell className="py-1 text-xs text-muted-foreground">{acc.displayName}</TableCell>
                    <TableCell className="py-1 text-xs">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                        {ROLE_LABEL_VI[acc.role] ?? acc.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 text-xs font-mono text-muted-foreground">{acc.code ?? "—"}</TableCell>
                    <TableCell className="py-1 font-mono text-xs text-foreground select-all">{acc.tempPassword}</TableCell>
                    <TableCell className="py-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => copyToClipboard(acc.tempPassword)}
                        title="Sao chép mật khẩu"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-destructive">Chi tiết các dòng bị bỏ qua</p>
          <div className="max-h-36 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-7 bg-muted/40">
                  <TableHead className="w-16 text-xs">Dòng</TableHead>
                  <TableHead className="text-xs">Nguyên nhân</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.map((error, index) => (
                  <TableRow key={`${error.row}-${index}`} className="h-7">
                    <TableCell className="py-1 text-xs font-mono">{error.row}</TableCell>
                    <TableCell className="py-1 text-xs text-muted-foreground">{error.message ?? error.code}</TableCell>
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

export function ImportAccountsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AccountImportResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useImportAccounts();

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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px] p-4 sm:p-5 gap-3">
        <DialogHeader icon={FileSpreadsheet} iconTone="violet">
          <DialogTitle className="text-base">Import tài khoản từ Excel</DialogTitle>
          <DialogDescription className="text-xs">
            Hỗ trợ thêm hàng loạt tài khoản người dùng với các vai trò Quản trị viên, Quản lý, Giảng viên hoặc Sinh viên.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-1">
            <TemplateGuide />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <FileSpreadsheet className="size-5 text-muted-foreground" />
                </div>
                {file ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB — Nhấp để đổi file khác</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Chọn file Excel (.xlsx)</p>
                    <p className="text-[11px] text-muted-foreground">Kéo thả file vào đây hoặc nhấp để duyệt file từ máy tính</p>
                  </div>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </div>
          </div>
        ) : (
          <ResultSummary result={result} />
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          {result ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Hoàn tất
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={!file || isPending} className="gap-1.5">
                <Upload className="size-4" />
                {isPending ? "Đang import..." : "Bắt đầu Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
