"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusDot } from "../../_shared/status-dot";
import { SESSION_STATUS_META, type SessionStatus } from "../../_shared/labels";
import { useLecturers } from "@/hooks/manager/useLecturers";
import { formatDate } from "@/lib/utils/formatDate";
import type { RoomApiItem } from "@/lib/api/services/fetchRooms";
import type { RoundTimeslot } from "@/lib/api/services/fetchRounds";
import type { DisplaySession, MoveTarget } from "./types";

function ChangeReviewersDialog({
  session,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  session: DisplaySession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reviewerIds: number[], reason: string) => void;
  isPending: boolean;
}) {
  const { data: lecturers } = useLecturers();
  const [selected, setSelected] = useState<Set<number>>(new Set(session.reviewers.map((r) => r.id)));
  const [reason, setReason] = useState("");

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0 || !reason.trim()) return;
    onSubmit(Array.from(selected), reason);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thay reviewer</DialogTitle>
            <DialogDescription>{session.groupCode}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {(lecturers ?? []).map((l) => (
                <label key={l.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                  <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                  <span className="font-medium">{l.lecturer_code}</span>
                  <span className="text-muted-foreground">— {l.display_name}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || selected.size === 0 || !reason.trim()}>
              {isPending ? "Đang lưu..." : "Cập nhật reviewer"}
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
  timeslots,
  onOpenChange,
  onRequestMove,
  onChangeReviewers,
  changeReviewersPending,
}: {
  session: DisplaySession | null;
  rooms: RoomApiItem[];
  timeslots: RoundTimeslot[];
  onOpenChange: (open: boolean) => void;
  onRequestMove: (target: MoveTarget) => void;
  onChangeReviewers: (reviewerIds: number[], reason: string) => void;
  changeReviewersPending: boolean;
}) {
  const [reviewersDialogOpen, setReviewersDialogOpen] = useState(false);

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
                      const meta = SESSION_STATUS_META[session.status as SessionStatus];
                      return meta ? <StatusDot tone={meta.tone} label={meta.label} /> : <span>{session.status}</span>;
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phòng</p>
                  <p className="mt-1 font-medium">{session.roomCode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Đổi giờ</p>
                  <Select
                    value={String(session.timeslotId)}
                    onValueChange={(v) => {
                      const slot = timeslots.find((t) => t.id === Number(v));
                      if (slot)
                        onRequestMove({
                          timeslotId: slot.id,
                          roomId: session.roomId,
                          date: slot.day_date,
                          start: formatDate(slot.start_at, "HH:mm"),
                          end: formatDate(slot.end_at, "HH:mm"),
                        });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: string) => {
                          const slot = timeslots.find((t) => String(t.id) === v);
                          return slot ? `${formatDate(slot.start_at, "HH:mm")} – ${formatDate(slot.end_at, "HH:mm")}` : "";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeslots.map((slot) => (
                        <SelectItem key={slot.id} value={String(slot.id)}>
                          {formatDate(slot.start_at, "HH:mm")} – {formatDate(slot.end_at, "HH:mm")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Đổi phòng</p>
                  <Select
                    value={String(session.roomId)}
                    onValueChange={(v) =>
                      v &&
                      onRequestMove({
                        timeslotId: session.timeslotId,
                        roomId: Number(v),
                        date: session.date,
                        start: session.start,
                        end: session.end,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => rooms.find((r) => String(r.id) === v)?.code ?? ""}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  Reviewers
                </p>
                <div className="mt-2 space-y-1.5">
                  {session.reviewers.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                      <span>{r.name}</span>
                      {session.resultOwnerIds.includes(r.id) && (
                        <span className="text-xs font-medium text-primary">Result Owner</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReviewersDialogOpen(true)}>
                Thay reviewer
              </Button>
              <Link href={`/manager/progress?group=${encodeURIComponent(session.groupCode)}`}>
                <Button variant="outline" size="sm">
                  Xem tiến độ nhóm
                </Button>
              </Link>
            </SheetFooter>

            <ChangeReviewersDialog
              session={session}
              open={reviewersDialogOpen}
              onOpenChange={setReviewersDialogOpen}
              isPending={changeReviewersPending}
              onSubmit={(reviewerIds, reason) => {
                onChangeReviewers(reviewerIds, reason);
                setReviewersDialogOpen(false);
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
