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
import { useCreateLecturer } from "@/hooks/useLecturers";

export function AddLecturerDialog() {
  const [open, setOpen] = useState(false);
  const [lecturerCode, setLecturerCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending } = useCreateLecturer();

  const canSave =
    lecturerCode.trim().length > 1 && displayName.trim().length > 1 && email.trim().length > 3 && password.length >= 12;

  function handleSave() {
    if (!canSave) return;
    mutate(
      { lecturer_code: lecturerCode.trim(), display_name: displayName.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          setOpen(false);
          setLecturerCode("");
          setDisplayName("");
          setEmail("");
          setPassword("");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><UserPlus />Thêm giảng viên</Button>} />
      <DialogContent>
        <DialogHeader>
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
