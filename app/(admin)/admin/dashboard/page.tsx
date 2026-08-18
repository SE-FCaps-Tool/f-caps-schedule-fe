import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan quản trị",
  path: "/admin/dashboard",
  noindex: true,
});

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản trị hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Tài khoản, master data giảng viên/phòng, và audit log toàn hệ thống.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Tổng số tài khoản</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Học kỳ đang hoạt động</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đợt đang LOCKED</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Audit log sẽ hiển thị khi kết nối API.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Chưa có dữ liệu.</CardContent>
      </Card>
    </div>
  );
}
