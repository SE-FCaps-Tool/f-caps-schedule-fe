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
import { useCreateAccount } from "@/hooks/admin/useAccounts";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT, type UserRole } from "@/lib/types/roles";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";

const ROLE_OPTIONS: UserRole[] = [ROLE_ADMIN, ROLE_MANAGER, ROLE_LECTURER, ROLE_STUDENT];

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | null>(ROLE_LECTURER);
  const [lecturerCode, setLecturerCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const { mutate, isPending } = useCreateAccount();

  const canSave =
    email.trim().length > 3 &&
    displayName.trim().length > 1 &&
    password.length >= 12 &&
    role &&
    (role !== ROLE_LECTURER || lecturerCode.trim().length > 0) &&
    (role !== ROLE_STUDENT || studentCode.trim().length > 0);

  function handleSave() {
    if (!canSave || !role) return;
    mutate(
      {
        email: email.trim(),
        displayName: displayName.trim(),
        password,
        role,
        lecturerCode: role === ROLE_LECTURER ? lecturerCode.trim() : undefined,
        studentCode: role === ROLE_STUDENT ? studentCode.trim() : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setEmail("");
          setDisplayName("");
          setPassword("");
          setLecturerCode("");
          setStudentCode("");
          setRole(ROLE_LECTURER);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><UserPlus />Tạo tài khoản</Button>} />
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader icon={UserPlus} iconTone="violet">
          <DialogTitle>Tạo tài khoản</DialogTitle>
          <DialogDescription>Tạo tài khoản đơn lẻ. Dùng &quot;Import CSV&quot; cho tạo hàng loạt.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-account-email">Email</Label>
            <Input
              id="new-account-email"
              type="email"
              placeholder="ten.gv@fe.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-account-name">Họ tên</Label>
            <Input
              id="new-account-name"
              placeholder="Nguyễn Văn A"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-account-password">Mật khẩu</Label>
            <Input
              id="new-account-password"
              type="password"
              placeholder="Tối thiểu 12 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn vai trò">{(v: UserRole) => ROLE_LABEL_VI[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL_VI[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role === ROLE_LECTURER && (
            <div className="space-y-1.5">
              <Label htmlFor="new-account-lecturer-code">Mã giảng viên</Label>
              <Input
                id="new-account-lecturer-code"
                placeholder="GV001"
                value={lecturerCode}
                onChange={(e) => setLecturerCode(e.target.value)}
              />
            </div>
          )}
          {role === ROLE_STUDENT && (
            <div className="space-y-1.5">
              <Label htmlFor="new-account-student-code">Mã sinh viên</Label>
              <Input
                id="new-account-student-code"
                placeholder="SE001"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
