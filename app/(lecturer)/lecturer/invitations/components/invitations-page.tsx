"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, CheckCircle2, Clock3, Mail, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusDot, toneBadgeClass } from "../../_shared/status-dot";
import { ROUND_TYPE_LABEL, INVITATION_STATUS_META } from "../../_shared/labels";
import { useLecturerInvitations, useRespondInvitation } from "@/hooks/lecturer/useLecturerPortal";
import { formatDateTime } from "@/lib/utils/formatDate";
import type { LecturerInvitation } from "@/lib/api/services/fetchLecturerPortal";
import { cn } from "@/lib/utils";

function InvitationStatus({ status }: { status: LecturerInvitation["status"] }) {
  const meta = INVITATION_STATUS_META[status];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1", toneBadgeClass[meta.tone])}>
      <StatusDot tone={meta.tone} label={meta.label} pulse={status === "PENDING"} />
    </span>
  );
}

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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Từ chối lời mời</DialogTitle>
            <DialogDescription>
              {invitation?.round.name || (invitation && ROUND_TYPE_LABEL[invitation.round.type])}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-5">
            <div className="rounded-lg bg-destructive/5 px-3 py-2.5 text-sm text-muted-foreground">
              Lý do giúp bộ môn sắp xếp người thay thế phù hợp cho đợt này.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="decline-reason">Lý do từ chối</Label>
              <Textarea
                id="decline-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Tôi có lịch công tác trong thời gian này"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="destructive" disabled={respond.isPending || !reason.trim()}>
              {respond.isPending ? "Đang gửi..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvitationsPage() {
  const { data: invitations, isLoading, isError, refetch } = useLecturerInvitations();
  const respond = useRespondInvitation();
  const [declineTarget, setDeclineTarget] = useState<LecturerInvitation | null>(null);
  const pendingCount = invitations?.filter((invitation) => invitation.status === "PENDING").length ?? 0;
  const acceptedCount = invitations?.filter((invitation) => invitation.status === "ACCEPTED").length ?? 0;

  return (
    <div className="w-full">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
            <Mail className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">Lời mời tham gia</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Phản hồi lời mời trước khi đăng ký lịch rảnh cho từng đợt đánh giá.
            </p>
          </div>
        </div>
        {!isLoading && !isError && invitations && invitations.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span><strong className="font-semibold text-foreground">{pendingCount}</strong> đang chờ</span>
            <span className="size-1 rounded-full bg-border" aria-hidden />
            <span><strong className="font-semibold text-foreground">{acceptedCount}</strong> đã nhận lời</span>
          </div>
        )}
      </header>

      {pendingCount > 0 && (
        <section className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4" aria-live="polite">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700" aria-hidden>
            <Clock3 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-950">Bạn có {pendingCount} lời mời cần phản hồi</p>
            <p className="mt-0.5 text-sm text-amber-900/75">Nhận lời để mở bước đăng ký lịch rảnh cho đợt tương ứng.</p>
          </div>
        </section>
      )}

      <section className="mt-6" aria-labelledby="invitation-list-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="invitation-list-title" className="text-lg font-semibold tracking-tight">Danh sách lời mời</h2>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái và hạn đăng ký của từng đợt.</p>
          </div>
          {invitations && invitations.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {invitations.length} đợt
            </span>
          )}
        </div>

        {isLoading && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-h-52 rounded-xl border border-border p-4 sm:p-5">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="mt-5 h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-52 max-w-full" />
                <Skeleton className="mt-6 h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-10 text-center">
            <WifiOff className="size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Không tải được danh sách lời mời</p>
            <p className="mt-1 text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </div>
        )}

        {invitations && invitations.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden>
              <Mail className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold">Chưa có lời mời nào</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Khi được mời tham gia một đợt đánh giá, thông tin sẽ xuất hiện tại đây.</p>
          </div>
        )}

        {invitations && invitations.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => {
              const roundName = invitation.round.name || ROUND_TYPE_LABEL[invitation.round.type];
              const meta = INVITATION_STATUS_META[invitation.status];
              return (
                <article
                  key={invitation.id}
                  className={cn(
                    "flex min-h-52 flex-col rounded-xl border p-4 transition-colors sm:p-5",
                    meta.tone === "amber" && "border-amber-200/80 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/50",
                    meta.tone === "emerald" && "border-emerald-200/80 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50/50",
                    meta.tone === "red" && "border-red-200/70 bg-red-50/20 hover:border-red-300 hover:bg-red-50/40",
                    (meta.tone === "neutral" || meta.tone === "sky" || meta.tone === "violet") && "border-border bg-card hover:border-primary/30 hover:bg-muted/15",
                    "dark:border-border dark:bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                      <CalendarCheck className="size-5" />
                    </span>
                    <InvitationStatus status={invitation.status} />
                  </div>
                  <div className="mt-5 min-w-0">
                    <h3 className="min-h-12 font-semibold leading-6">
                      {roundName}
                      {invitation.round.semester?.code && (
                        <span className="mt-1 block font-mono text-xs font-medium text-muted-foreground">
                          {invitation.round.semester.code}
                        </span>
                      )}
                    </h3>
                    <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Clock3 className="mt-0.5 size-4 shrink-0" />
                      <span>Hạn đăng ký: <span className="font-medium text-foreground tabular-nums">{formatDateTime(invitation.round.registrationDeadline)}</span></span>
                    </p>
                  </div>

                  {invitation.status === "PENDING" && (
                    <div className="mt-auto flex flex-col-reverse gap-2 pt-5 sm:flex-row">
                      <Button
                        variant="outline"
                        className="w-full border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-1"
                        onClick={() => setDeclineTarget(invitation)}
                      >
                        Từ chối
                      </Button>
                      <Button
                        className="w-full sm:flex-1"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ roundId: invitation.round.id, payload: { decision: "ACCEPTED" } })}
                      >
                        <CheckCircle2 className="size-4" />
                        Nhận lời
                      </Button>
                    </div>
                  )}

                  {invitation.status === "ACCEPTED" && (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      className="mt-auto w-full sm:mt-5"
                      render={
                        <Link
                          href={
                            invitation.round.semester?.code
                              ? `/lecturer/availability?semester=${encodeURIComponent(invitation.round.semester.code)}`
                              : "/lecturer/availability"
                          }
                        />
                      }
                    >
                      <CalendarCheck className="size-4" />
                      Đăng ký lịch rảnh
                      <ArrowUpRight className="size-4" />
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <DeclineDialog invitation={declineTarget} onOpenChange={(open) => !open && setDeclineTarget(null)} />
    </div>
  );
}
