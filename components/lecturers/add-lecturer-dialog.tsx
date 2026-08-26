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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLecturer } from "@/hooks/useLecturers";
import {
  SENIORITY_NONE_VALUE,
  SENIORITY_OPTIONS,
  type LecturerSeniorityLevel,
  seniorityLabel,
} from "@/lib/utils/masterDataLabels";

export function AddLecturerDialog() {
  const [open, setOpen] = useState(false);
  const [lecturerCode, setLecturerCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState<LecturerSeniorityLevel | null>(null);
  const { mutate, isPending } = useCreateLecturer();

  const canSave =
    lecturerCode.trim().length > 1 && displayName.trim().length > 1 && email.trim().length > 3 && password.length >= 12;

  function handleSave() {
    if (!canSave) return;
    mutate(
      {
        lecturerCode: lecturerCode.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        seniorityLevel,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setLecturerCode("");
          setDisplayName("");
          setEmail("");
          setPassword("");
          setSeniorityLevel(null);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><UserPlus />Thêm giảng viên</Button>} />
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader icon={UserPlus} iconTone="sky">
          <DialogTitle>Thêm giảng viên</DialogTitle>
          <DialogDescription>
            Tạo đồng thời tài khoản và hồ sơ giảng viên. Mã giảng viên dùng xuyên suốt hệ thống xếp lịch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lecturer-code">Mã giảng viên</Label>
            <Input id="lecturer-code" placeholder="TaiNT51" value={lecturerCode} onChange={(e) => setLecturerCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lecturer-name">Họ tên</Label>
            <Input id="lecturer-name" placeholder="Nguyễn Trọng Tài" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lecturer-email">Email</Label>
            <Input id="lecturer-email" type="email" placeholder="ten.gv@fe.edu.vn" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lecturer-password">Mật khẩu</Label>
            <Input
              id="lecturer-password"
              type="password"
              placeholder="Tối thiểu 12 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={password.length > 0 && password.length < 12}
            />
            {password.length > 0 && password.length < 12 && (
              <p className="text-xs text-destructive">Mật khẩu cần tối thiểu 12 ký tự (còn thiếu {12 - password.length}).</p>
            )}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? "Đang thêm..." : "Thêm giảng viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
