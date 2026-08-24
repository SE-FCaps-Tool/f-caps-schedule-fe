"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/shared/date-field";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateSemester } from "@/hooks/useSemesters";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";

function EditSemesterForm({ semester, onOpenChange }: { semester: SemesterApiItem; onOpenChange: (open: boolean) => void }) {
  const updateSemester = useUpdateSemester();
  const [code, setCode] = useState(semester.code);
  const [name, setName] = useState(semester.name);
  const [note, setNote] = useState(semester.note ?? "");
  const [startDate, setStartDate] = useState(semester.startDate);
  const [endDate, setEndDate] = useState(semester.endDate);

  // DateField là <button> nên không có validation `required` của input native — chặn ở đây.
  const canSubmit = Boolean(code.trim() && name.trim() && startDate && endDate && startDate <= endDate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    updateSemester.mutate(
      {
        id: semester.id,
        payload: { code, name, note: note.trim() ? note : undefined, start_date: startDate, end_date: endDate },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader icon={CalendarDays} iconTone="violet">
        <DialogTitle>Chỉnh sửa học kỳ</DialogTitle>
        <DialogDescription>Không đổi được trạng thái ở đây — dùng hành động Đóng học kỳ / Đặt làm hiện tại.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Mã học kỳ</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Tên học kỳ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Ngày bắt đầu</Label>
            <DateField ariaLabel="Ngày bắt đầu học kỳ" value={startDate} onChange={setStartDate} max={endDate || undefined} />
          </div>
          <div className="space-y-1.5">
            <Label>Ngày kết thúc</Label>
            <DateField ariaLabel="Ngày kết thúc học kỳ" value={endDate} onChange={setEndDate} min={startDate || undefined} />
          </div>
        </div>
        {startDate !== "" && endDate !== "" && startDate > endDate && (
          <p className="text-xs text-destructive">Ngày kết thúc phải sau ngày bắt đầu.</p>
        )}
        <div className="space-y-1.5">
          <Label>Ghi chú (tùy chọn)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Capstone semester" />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateSemester.isPending || !canSubmit}>
          {updateSemester.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditSemesterDialog({
  semester,
  onOpenChange,
}: {
  semester: SemesterApiItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={semester !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {semester && <EditSemesterForm key={semester.id} semester={semester} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}
