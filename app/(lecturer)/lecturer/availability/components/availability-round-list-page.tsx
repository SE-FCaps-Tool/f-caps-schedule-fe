"use client";

import Link from "next/link";
import { ChevronRight, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUND_TYPE_LABEL } from "../../_shared/labels";
import { useLecturerInvitations } from "@/hooks/lecturer/useLecturerPortal";
import { formatDateTime } from "@/lib/utils/formatDate";

export function AvailabilityRoundListPage() {
  const { data: invitations, isLoading, isError } = useLecturerInvitations();
  const accepted = invitations?.filter((inv) => inv.status === "ACCEPTED") ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Đăng ký lịch rảnh</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chọn đợt đánh giá đã nhận lời để đăng ký lịch rảnh.</p>

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
            Không tải được danh sách đợt đánh giá.
          </div>
        )}
        {invitations && accepted.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Bạn chưa nhận lời mời nào — vào mục Lời mời để phản hồi trước.
          </p>
        )}
        {accepted.length > 0 && (
          <div className="space-y-2">
            {accepted.map((inv) => (
              <Link
                key={inv.id}
                href={`/lecturer/availability/${inv.round.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div>
                  <p className="font-medium">{inv.round.name || ROUND_TYPE_LABEL[inv.round.type]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    Hạn đăng ký: {formatDateTime(inv.round.registrationDeadline)}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
