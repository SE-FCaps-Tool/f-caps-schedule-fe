import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan giảng viên",
  path: "/lecturer/dashboard",
  noindex: true,
});

export default function LecturerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Xin chào</h1>
        <p className="text-sm text-muted-foreground">
          Đăng ký lịch rảnh và xem lịch chấm sắp tới của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lời mời tham gia đợt đánh giá</CardTitle>
          <CardDescription>Bạn chưa có lời mời nào đang chờ phản hồi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Đăng ký lịch rảnh
          </Button>
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
