"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatInVietnamTime } from "@/lib/utils/formatDate";
import { useUpdateRound } from "@/hooks/manager/useRounds";
import type { RoomType, RoundDetail, RoundUpdatePayload } from "@/lib/api/services/fetchRounds";

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  NORMAL: "Phòng thường",
  SEMINAR: "Seminar",
  LAB: "Lab",
};

const ROOM_TYPES: RoomType[] = ["NORMAL", "SEMINAR", "LAB"];

/** BE lưu instant, hiển thị/sửa theo giờ Việt Nam (spec §9) — trùng convention với create-round-wizard. */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatInVietnamTime(iso, "YYYY-MM-DDTHH:mm");
}

function datetimeLocalToIso(value: string): string {
  return `${value}:00+07:00`;
}

function RoundConfigEditForm({
  round,
  onOpenChange,
}: {
  round: RoundDetail;
  onOpenChange: (open: boolean) => void;
}) {
  const updateRound = useUpdateRound();
  const [startDate, setStartDate] = useState(round.startDate);
  const [endDate, setEndDate] = useState(round.endDate);
  const [durationMinutes, setDurationMinutes] = useState(String(round.durationMinutes || ""));
  const [maxGroupsPerTimeslot, setMaxGroupsPerTimeslot] = useState(String(round.maxGroupsPerTimeslot || ""));
  const [registrationDeadline, setRegistrationDeadline] = useState(isoToDatetimeLocal(round.registrationDeadline));
  const [groupSelectionMode, setGroupSelectionMode] = useState(round.groupSelectionMode);
  const [resultOwnerMode, setResultOwnerMode] = useState(round.resultOwnerMode);
  const [roomTypes, setRoomTypes] = useState<Set<RoomType>>(new Set(round.roomTypes));

  function toggleRoomType(rt: RoomType) {
    setRoomTypes((prev) => {
      const next = new Set(prev);
      if (next.has(rt)) next.delete(rt);
      else next.add(rt);
      return next;
    });
  }

  const duration = Number(durationMinutes) || 0;
  const maxGroups = Number(maxGroupsPerTimeslot) || 0;
  const isValid =
    startDate !== "" &&
    endDate !== "" &&
    startDate <= endDate &&
    duration > 0 &&
    maxGroups > 0 &&
    registrationDeadline !== "" &&
    roomTypes.size >= 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    const payload: RoundUpdatePayload = {
      startDate,
      endDate,
      durationMinutes: duration,
      maxGroupsPerTimeslot: maxGroups,
      registrationDeadline: datetimeLocalToIso(registrationDeadline),
      groupSelectionMode,
      resultOwnerMode,
      roomTypes: Array.from(roomTypes),
    };
    updateRound.mutate(
      { roundId: round.id, payload },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Chỉnh sửa cấu hình đợt đánh giá</DialogTitle>
        <DialogDescription>
          Chỉ áp dụng được khi đợt còn ở trạng thái Nháp hoặc Đang mở đăng ký. Ngày/khung giờ đã tạo giữ nguyên,
          không sửa được ở đây.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[65vh] space-y-4 overflow-y-auto py-4">
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
        {startDate !== "" && endDate !== "" && startDate > endDate && (
          <p className="text-xs text-destructive">Ngày kết thúc phải sau ngày bắt đầu.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Thời lượng (phút)</Label>
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nhóm tối đa / slot</Label>
            <Input
              type="number"
              min={1}
              value={maxGroupsPerTimeslot}
              onChange={(e) => setMaxGroupsPerTimeslot(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Số reviewer / buổi</Label>
          <Input type="number" value={round.reviewerCount} disabled />
          <p className="text-xs text-muted-foreground">
            Cố định theo loại đợt — không sửa được (BE từ chối nếu khác giá trị mặc định của loại đợt).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Hạn đăng ký chọn lịch</Label>
          <Input
            type="datetime-local"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Nhóm tự chọn lịch</p>
            <p className="text-xs text-muted-foreground">Leader chọn slot ưu tiên thay vì Manager xếp toàn bộ.</p>
          </div>
          <Switch checked={groupSelectionMode} onCheckedChange={setGroupSelectionMode} aria-label="Nhóm tự chọn lịch" />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Chỉ định Result Owner</p>
            <p className="text-xs text-muted-foreground">Một reviewer được chỉ định nhập kết quả chính thức.</p>
          </div>
          <Switch checked={resultOwnerMode} onCheckedChange={setResultOwnerMode} aria-label="Chỉ định Result Owner" />
        </div>

        <div className="space-y-2">
          <Label>Loại phòng cho phép</Label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((rt) => {
              const active = roomTypes.has(rt);
              return (
                <button
                  key={rt}
                  type="button"
                  onClick={() => toggleRoomType(rt)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  <DoorOpen className="size-3.5 shrink-0" aria-hidden />
                  {ROOM_TYPE_LABEL[rt]}
                </button>
              );
            })}
          </div>
          {roomTypes.size === 0 && (
            <p className="text-xs text-destructive">Chọn ít nhất 1 loại phòng.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!isValid || updateRound.isPending}>
          {updateRound.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RoundConfigEditDialog({
  round,
  open,
  onOpenChange,
}: {
  round: RoundDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <RoundConfigEditForm key={round.id} round={round} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}
