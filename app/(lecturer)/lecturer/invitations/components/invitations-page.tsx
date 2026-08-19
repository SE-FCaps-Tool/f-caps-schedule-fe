"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusDot } from "../../_shared/status-dot";
import { ROUND_TYPE_LABEL, INVITATION_STATUS_META } from "../../_shared/labels";
import { useLecturerInvitations, useRespondInvitation } from "@/hooks/lecturer/useLecturerPortal";
import { formatDateTime } from "@/lib/utils/formatDate";
import type { LecturerInvitation } from "@/lib/api/services/fetchLecturerPortal";

function DeclineDialog({
  invitation,
  onOpenChange,
}: {
  invitation: LecturerInvitation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const respond = useRespondInvitation();
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitation || !reason.trim()) return;
    respond.mutate(
      { roundId: invitation.round.id, payload: { decision: "DECLINED", reason } },
      { onSuccess: () => { setReason(""); onOpenChange(false); } }
    );
  }

  return (
    <Dialog open={invitation !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Từ chối lời mời</DialogTitle>
            <DialogDescription>{invitation?.round.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-4">
            <Label>Lý do</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={respond.isPending || !reason.trim()}>
              {respond.isPending ? "Đang gửi..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvitationsPage() {
  const { data: invitations, isLoading, isError } = useLecturerInvitations();
  const respond = useRespondInvitation();
  const [declineTarget, setDeclineTarget] = useState<LecturerInvitation | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Lời mời tham gia đợt đánh giá</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nhận lời trước khi đăng ký lịch rảnh cho đợt tương ứng.</p>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách lời mời. Thử tải lại trang.
          </div>
        )}
        {invitations && invitations.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Bạn chưa có lời mời nào.</p>
        )}
        {invitations && invitations.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Đợt đánh giá</TableHead>
                  <TableHead>Hạn đăng ký</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Hành động</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const meta = INVITATION_STATUS_META[inv.status];
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="pl-4 font-medium">
                        {inv.round.name || ROUND_TYPE_LABEL[inv.round.type]}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateTime(inv.round.registrationDeadline)}
                      </TableCell>
                      <TableCell>
                        <StatusDot tone={meta.tone} label={meta.label} pulse={inv.status === "PENDING"} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {inv.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDeclineTarget(inv)}>
                              Từ chối
                            </Button>
                            <Button
                              size="sm"
                              disabled={respond.isPending}
                              onClick={() => respond.mutate({ roundId: inv.round.id, payload: { decision: "ACCEPTED" } })}
                            >
                              Nhận lời
                            </Button>
                          </div>
                        )}
                        {inv.status === "ACCEPTED" && (
                          <Link href="/lecturer/availability">
                            <Button variant="outline" size="sm">
                              <CalendarCheck />
                              Đăng ký lịch rảnh
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DeclineDialog invitation={declineTarget} onOpenChange={(open) => !open && setDeclineTarget(null)} />
    </div>
  );
}
