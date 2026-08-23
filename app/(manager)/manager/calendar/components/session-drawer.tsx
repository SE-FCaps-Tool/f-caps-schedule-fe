"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, DoorOpen, UserRoundCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_SESSION_STATUS_META, type RoundSessionStatus } from "../../_shared/labels";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { formatDate } from "@/lib/utils/formatDate";
import type { AssignableRoom } from "@/lib/api/services/fetchRoomAssignment";
import type { DisplaySession } from "./types";

function ChangeRoomDialog({
  session,
  rooms,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  session: DisplaySession;
  rooms: AssignableRoom[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roomId: string, reason: string) => void;
  isPending: boolean;
}) {
  const [roomId, setRoomId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !reason.trim()) return;
    onSubmit(roomId, reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={DoorOpen} iconTone="sky">
            <DialogTitle>Đổi phòng</DialogTitle>
            <DialogDescription>{session.groupCode}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={roomId} onValueChange={(v) => v && setRoomId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn phòng">
                  {(v: string) => rooms.find((r) => r.id === v)?.code ?? "Chọn phòng"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {rooms
                  .filter((r) => r.id !== session.roomId)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} · {r.type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || !roomId || !reason.trim()}>
              {isPending ? "Đang lưu..." : "Đổi phòng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReplaceReviewerDialog({
  session,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  session: DisplaySession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (oldLecturerId: string, newLecturerId: string, reason: string) => void;
  isPending: boolean;
}) {
  const { data: lecturers } = useLecturers();
  const [oldLecturerId, setOldLecturerId] = useState("");
  const [newLecturerId, setNewLecturerId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oldLecturerId || !newLecturerId || !reason.trim()) return;
    onSubmit(oldLecturerId, newLecturerId, reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={UserRoundCog} iconTone="violet">
            <DialogTitle>Thay reviewer</DialogTitle>
            <DialogDescription>{session.groupCode} — Council cũ vẫn giữ nguyên, hệ thống tạo council mới thay thế.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Reviewer cần thay</Label>
              <Select value={oldLecturerId} onValueChange={(v) => v && setOldLecturerId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn reviewer trong council">
                    {(v: string) => session.reviewers.find((r) => r.id === v)?.name ?? "Chọn reviewer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {session.reviewers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reviewer thay thế</Label>
              <Select value={newLecturerId} onValueChange={(v) => v && setNewLecturerId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giảng viên">
                    {(v: string) => {
                      const l = lecturers?.find((l) => String(l.id) === v);
                      return l ? `${l.lecturerCode} — ${l.displayName}` : "Chọn giảng viên";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(lecturers ?? [])
                    .filter((l) => !session.reviewers.some((r) => r.id === String(l.id)))
                    .map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.lecturerCode} — {l.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || !oldLecturerId || !newLecturerId || !reason.trim()}>
              {isPending ? "Đang lưu..." : "Thay reviewer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostponeDialog({
  session,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  session: DisplaySession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader icon={Clock3} iconTone="amber">
            <DialogTitle>Hoãn buổi</DialogTitle>
            <DialogDescription>
              {session.groupCode} — buổi gốc chuyển sang &ldquo;Đã hoãn&rdquo; và giữ nguyên, không xoá. Tạo buổi bù riêng sau khi hoãn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isPending || !reason.trim()}>
              {isPending ? "Đang lưu..." : "Hoãn buổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SessionDrawer({
  session,
  rooms,
  onOpenChange,
  onChangeRoom,
  changeRoomPending,
  onReplaceReviewer,
  replaceReviewerPending,
  onPostpone,
  postponePending,
}: {
  session: DisplaySession | null;
  rooms: AssignableRoom[];
  onOpenChange: (open: boolean) => void;
  onChangeRoom: (roomId: string, reason: string) => void;
  changeRoomPending: boolean;
  onReplaceReviewer: (oldLecturerId: string, newLecturerId: string, reason: string) => void;
  replaceReviewerPending: boolean;
  onPostpone: (reason: string) => void;
  postponePending: boolean;
}) {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [reviewerDialogOpen, setReviewerDialogOpen] = useState(false);
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);

  const canOperate = session ? session.status === "SCHEDULED" || session.status === "PLANNED" : false;

  return (
    <Sheet open={session !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        {session && (
          <>
            <SheetHeader>
              <SheetTitle>{session.groupCode}</SheetTitle>
              <SheetDescription>{session.projectTitle ?? "—"}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ngày</p>
                  <p className="mt-1 font-medium tabular-nums">{formatDate(session.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Giờ</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {session.start} – {session.end}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <div className="mt-1">
                    {(() => {
                      const meta = ROUND_SESSION_STATUS_META[session.status as RoundSessionStatus];
                      return meta ? <StatusDot tone={meta.tone} label={meta.label} /> : <span>{session.status}</span>;
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phòng</p>
                  <p className="mt-1 font-medium">{session.roomCode}</p>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  Council (reviewer)
                </p>
                <div className="mt-2 space-y-1.5">
                  {session.reviewers.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" disabled={!canOperate} onClick={() => setRoomDialogOpen(true)}>
                Đổi phòng
              </Button>
              <Button variant="outline" size="sm" disabled={!canOperate} onClick={() => setReviewerDialogOpen(true)}>
                Thay reviewer
              </Button>
              <Button variant="outline" size="sm" disabled={!canOperate} onClick={() => setPostponeDialogOpen(true)}>
                Hoãn buổi
              </Button>
              <Link href={`/manager/progress?group=${encodeURIComponent(session.groupCode)}`}>
                <Button variant="outline" size="sm">
                  Xem tiến độ nhóm
                </Button>
              </Link>
            </SheetFooter>

            <ChangeRoomDialog
              session={session}
              rooms={rooms}
              open={roomDialogOpen}
              onOpenChange={setRoomDialogOpen}
              isPending={changeRoomPending}
              onSubmit={(roomId, reason) => {
                onChangeRoom(roomId, reason);
                setRoomDialogOpen(false);
              }}
            />
            <ReplaceReviewerDialog
              session={session}
              open={reviewerDialogOpen}
              onOpenChange={setReviewerDialogOpen}
              isPending={replaceReviewerPending}
              onSubmit={(oldLecturerId, newLecturerId, reason) => {
                onReplaceReviewer(oldLecturerId, newLecturerId, reason);
                setReviewerDialogOpen(false);
              }}
            />
            <PostponeDialog
              session={session}
              open={postponeDialogOpen}
              onOpenChange={setPostponeDialogOpen}
              isPending={postponePending}
              onSubmit={(reason) => {
                onPostpone(reason);
                setPostponeDialogOpen(false);
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
