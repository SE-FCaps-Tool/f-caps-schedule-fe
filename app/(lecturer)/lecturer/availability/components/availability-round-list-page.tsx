"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, CheckCircle2, ChevronRight, Clock3, Mail, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUND_TYPE_LABEL, INVITATION_STATUS_META } from "../../_shared/labels";
import { StatusDot, toneBadgeClass } from "../../_shared/status-dot";
import { useLecturerInvitations } from "@/hooks/lecturer/useLecturerPortal";
import { formatDateTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function AvailabilityRoundListPage() {
  const { data: invitations, isLoading, isError, refetch } = useLecturerInvitations();
  const hydrated = useHydrated();
  const accepted = invitations?.filter((invitation) => invitation.status === "ACCEPTED") ?? [];
  const pendingCount = invitations?.filter((invitation) => invitation.status === "PENDING").length ?? 0;

  return (
    <div className="w-full">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden>
            <CalendarCheck className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">Đăng ký lịch rảnh</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Chọn các khung giờ bạn có thể tham gia trong từng đợt đánh giá.
            </p>
          </div>
        </div>
        {hydrated && !isLoading && !isError && invitations && invitations.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span><strong className="font-semibold text-foreground">{accepted.length}</strong> sẵn sàng đăng ký</span>
            <span className="size-1 rounded-full bg-border" aria-hidden />
            <span><strong className="font-semibold text-foreground">{pendingCount}</strong> chờ nhận lời</span>
          </div>
        )}
      </header>

      {hydrated && pendingCount > 0 && (
        <section className="mt-5 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700" aria-hidden>
              <Mail className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-sky-950">Còn {pendingCount} lời mời chưa phản hồi</p>
              <p className="mt-0.5 text-sm text-sky-900/75">Nhận lời mời trước để mở đăng ký lịch rảnh.</p>
            </div>
          </div>
          <Link href="/lecturer/invitations" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-sky-800 hover:text-sky-950 sm:self-auto">
            Xem lời mời
            <ArrowUpRight className="size-4" />
          </Link>
        </section>
      )}

      <section className="mt-6" aria-labelledby="availability-rounds-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="availability-rounds-title" className="text-lg font-semibold tracking-tight">Các đợt có thể đăng ký</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chọn một đợt để xem timeslot và gửi lịch rảnh.</p>
          </div>
          {accepted.length > 0 && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {accepted.length} đợt
            </span>
          )}
        </div>

        {(!hydrated || isLoading) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-h-52 rounded-xl border border-border p-4 sm:p-5">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="mt-5 h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-64 max-w-full" />
                <Skeleton className="mt-6 h-4 w-36" />
                <Skeleton className="mt-5 h-5 w-32" />
              </div>
            ))}
          </div>
        )}

        {hydrated && isError && (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-10 text-center">
            <WifiOff className="size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Không tải được các đợt đánh giá</p>
            <p className="mt-1 text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Thử lại
            </Button>
          </div>
        )}

        {hydrated && invitations && accepted.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden>
              <CalendarCheck className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold">
              {pendingCount > 0 ? "Chưa có đợt nào sẵn sàng đăng ký" : "Chưa có lịch rảnh cần đăng ký"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {pendingCount > 0
                ? "Bạn cần nhận lời mời trước, sau đó đợt đánh giá sẽ xuất hiện tại đây."
                : "Các đợt đã nhận lời sẽ được hiển thị tại đây để bạn chọn timeslot."}
            </p>
            {pendingCount > 0 && (
              <Link href="/lecturer/invitations" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">
                Mở lời mời
                <ArrowUpRight className="size-4" />
              </Link>
            )}
          </div>
        )}

        {hydrated && accepted.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((invitation) => {
              const roundName = invitation.round.name || ROUND_TYPE_LABEL[invitation.round.type];
              const meta = INVITATION_STATUS_META[invitation.status];
              return (
                <Link
                  key={invitation.id}
                  href={
                    invitation.round.semester?.code
                      ? `/lecturer/availability/${invitation.round.id}?semester=${encodeURIComponent(invitation.round.semester.code)}`
                      : `/lecturer/availability/${invitation.round.id}`
                  }
                  className="group flex min-h-52 flex-col rounded-xl border border-emerald-200/80 bg-emerald-50/35 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700" aria-hidden>
                      <CheckCircle2 className="size-5" />
                    </span>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1", toneBadgeClass[meta.tone])}>
                      <StatusDot tone={meta.tone} label="Đã nhận lời" />
                    </span>
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
                  <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                    Chọn khung giờ
                    <ChevronRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
