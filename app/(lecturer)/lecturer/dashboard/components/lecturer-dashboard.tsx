"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLecturerInvitations } from "@/hooks/lecturer/useLecturerPortal";

export function LecturerDashboard() {
  const { data: invitations } = useLecturerInvitations();
  const pendingCount = invitations?.filter((inv) => inv.status === "PENDING").length ?? 0;
  const acceptedCount = invitations?.filter((inv) => inv.status === "ACCEPTED").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Xin chào</h1>
        <p className="text-sm text-muted-foreground">Đăng ký lịch rảnh và xem lịch chấm sắp tới của bạn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lời mời tham gia đợt đánh giá</CardTitle>
          <CardDescription>
            {pendingCount > 0
              ? `Bạn có ${pendingCount} lời mời đang chờ phản hồi.`
              : "Bạn chưa có lời mời nào đang chờ phản hồi."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href="/lecturer/invitations">
            <Button variant={pendingCount > 0 ? "default" : "outline"}>Xem lời mời</Button>
          </Link>
          {acceptedCount > 0 && (
            <Link href="/lecturer/availability">
              <Button variant="outline">Đăng ký lịch rảnh</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phiên đánh giá sắp tới</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Chưa có dữ liệu.</CardContent>
      </Card>
    </div>
  );
}
