"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import { ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";
import type { AccountApiItem, AccountRolePayload } from "@/lib/api/services/fetchAccounts";
import {
  SENIORITY_NONE_VALUE,
  SENIORITY_OPTIONS,
  type LecturerSeniorityLevel,
  seniorityLabel,
} from "@/lib/utils/masterDataLabels";

export function RoleAssignmentDialog({
  account,
  role,
  open,
  onOpenChange,
  onConfirm,
}: {
  account: AccountApiItem | null;
  role: UserRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: AccountRolePayload) => void;
}) {
  const [reason, setReason] = useState("");
  const [lecturerCode, setLecturerCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState<LecturerSeniorityLevel | null>(null);

  if (!account || !role) return null;

  const selectedRole = role;
  const requiresCode = selectedRole === ROLE_LECTURER || selectedRole === ROLE_STUDENT;
  const code = selectedRole === ROLE_LECTURER ? lecturerCode : studentCode;
  const canConfirm = reason.trim().length > 0 && (!requiresCode || code.trim().length > 0);

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({
      role: selectedRole,
      reason: reason.trim(),
      lecturerCode: selectedRole === ROLE_LECTURER ? lecturerCode.trim() : undefined,
      seniorityLevel: selectedRole === ROLE_LECTURER ? seniorityLevel : undefined,
      studentCode: selectedRole === ROLE_STUDENT ? studentCode.trim() : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={UserPlus} iconTone="violet">
          <DialogTitle>Gán {ROLE_LABEL_VI[selectedRole]}</DialogTitle>
          <DialogDescription>
            Gán thêm vai trò cho {account.displayName} ({account.email}).
          </DialogDescription>
        </DialogHeader>

        {selectedRole === ROLE_LECTURER && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="assign-lecturer-code">Mã giảng viên</Label>
              <Input
                id="assign-lecturer-code"
                placeholder="GV001"
                value={lecturerCode}
                onChange={(e) => setLecturerCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
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
          </>
        )}
        {selectedRole === ROLE_STUDENT && (
          <div className="space-y-1.5">
            <Label htmlFor="assign-student-code">Mã sinh viên</Label>
            <Input
              id="assign-student-code"
              placeholder="SE001"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="assign-role-reason">Lý do</Label>
          <Textarea
            id="assign-role-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bắt buộc — dùng để ghi audit log"
            className="min-h-20"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Gán vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
