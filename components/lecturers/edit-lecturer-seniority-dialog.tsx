"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateLecturer } from "@/hooks/useLecturers";
import type { LecturerApiItem } from "@/lib/api/services/fetchLecturers";
import {
  SENIORITY_NONE_VALUE,
  SENIORITY_OPTIONS,
  type LecturerSeniorityLevel,
  seniorityLabel,
} from "@/lib/utils/masterDataLabels";

export function EditLecturerSeniorityDialog({
  lecturer,
  open,
  onOpenChange,
}: {
  lecturer: LecturerApiItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [seniorityLevel, setSeniorityLevel] = useState<LecturerSeniorityLevel | null>(
    () => lecturer?.seniorityLevel ?? null
  );
  const updateLecturer = useUpdateLecturer();

  function handleSave() {
    if (!lecturer) return;
    updateLecturer.mutate(
      { lecturerId: lecturer.id, payload: { seniorityLevel } },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Pencil} iconTone="sky">
          <DialogTitle>Cập nhật mức độ kinh nghiệm</DialogTitle>
          <DialogDescription>
            {lecturer ? `${lecturer.displayName} (${lecturer.lecturerCode})` : "Chọn mức độ kinh nghiệm của giảng viên."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label>Mức độ kinh nghiệm</Label>
          <Select
            value={seniorityLevel ?? SENIORITY_NONE_VALUE}
            onValueChange={(value) =>
              setSeniorityLevel(value === SENIORITY_NONE_VALUE ? null : (value as LecturerSeniorityLevel))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn mức độ kinh nghiệm">
                {(value: string) => seniorityLabel(value === SENIORITY_NONE_VALUE ? null : (value as LecturerSeniorityLevel))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SENIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span>{option.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{option.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={!lecturer || updateLecturer.isPending}>
            {updateLecturer.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
