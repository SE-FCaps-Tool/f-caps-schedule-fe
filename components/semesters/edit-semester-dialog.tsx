"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateSemester } from "@/hooks/useSemesters";
import type { SemesterApiItem } from "@/lib/api/services/fetchSemesters";

function EditSemesterForm({ semester, onOpenChange }: { semester: SemesterApiItem; onOpenChange: (open: boolean) => void }) {
  const updateSemester = useUpdateSemester();
  const [code, setCode] = useState(semester.code);
  const [name, setName] = useState(semester.name);
  const [note, setNote] = useState(semester.note ?? "");
  const [startDate, setStartDate] = useState(semester.start_date);
  const [endDate, setEndDate] = useState(semester.end_date);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <DialogHeader>
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
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Ngày kết thúc</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Ghi chú (tùy chọn)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Capstone semester" />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateSemester.isPending}>
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
