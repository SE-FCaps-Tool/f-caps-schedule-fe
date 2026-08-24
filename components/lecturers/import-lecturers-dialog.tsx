"use client";

import { useRef, useState } from "react";
import { Copy, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useImportLecturers } from "@/hooks/useLecturers";
import type { LecturerImportResponse } from "@/lib/api/services/fetchLecturers";

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Đã copy");
  } catch {
    toast.error("Không copy được — trình duyệt chặn quyền clipboard");
  }
}

function ResultSummary({ result }: { result: LecturerImportResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{result.created} đã tạo</Badge>
        {result.skipped > 0 && <Badge variant="destructive">{result.skipped} bị bỏ qua</Badge>}
      </div>

      {result.accounts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Mật khẩu tạm thời (chỉ hiển thị một lần)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  result.accounts
                    .map((a) => `${a.lecturerCode}\t${a.email}\t${a.tempPassword}`)
                    .join("\n")
                )
              }
            >
              <Copy /> Copy tất cả
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            Hệ thống chưa có luồng đặt lại mật khẩu — hãy copy và gửi cho giảng viên ngay, mật khẩu sẽ không hiển thị lại sau khi đóng hộp thoại này.
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã GV</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mật khẩu tạm</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.accounts.map((account) => (
                  <TableRow key={account.lecturerId}>
                    <TableCell className="font-medium">{account.lecturerCode}</TableCell>
                    <TableCell className="text-muted-foreground">{account.email}</TableCell>
                    <TableCell className="font-mono text-xs">{account.tempPassword}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => copyToClipboard(account.tempPassword)}
                      >
                        <Copy className="size-3.5" />
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
        <div className="space-y-2">
          <p className="text-sm font-medium">Các dòng bị bỏ qua</p>
          <div className="max-h-48 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Dòng</TableHead>
                  <TableHead>Lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.map((error, index) => (
                  <TableRow key={`${error.row}-${index}`}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell className="text-muted-foreground">{error.message ?? error.code}</TableCell>
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

export function ImportLecturersDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<LecturerImportResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useImportLecturers();

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
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline"><Upload />Import Excel</Button>} />
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader icon={FileSpreadsheet} iconTone="emerald">
          <DialogTitle>Import giảng viên từ Excel</DialogTitle>
          <DialogDescription>
            Dùng đúng mẫu lecturers_template.xlsx (cột STT, Mã giảng viên, Họ và tên, Email). Mỗi
            dòng hợp lệ sẽ tạo một tài khoản giảng viên với mật khẩu tạm được sinh tự động.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/40"
            >
              <FileSpreadsheet className="size-6" />
              {file ? file.name : "Chọn file .xlsx"}
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

        <DialogFooter>
          {result ? (
            <Button
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={!file || isPending}>
                {isPending ? "Đang import..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
