import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildPageMetadata({
  title: "Tổng quan Bộ môn",
  path: "/manager/dashboard",
  noindex: true,
});

const stats = [
  { label: "Nhóm chưa xếp lịch", value: "—", tone: "destructive" as const },
  { label: "Giảng viên chưa đăng ký lịch rảnh", value: "—", tone: "secondary" as const },
  { label: "Đợt đang mở đăng ký", value: "—", tone: "default" as const },
];

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi tiến độ xếp lịch đánh giá Capstone của học kỳ đang hoạt động.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <Badge variant={stat.tone}>Cần chú ý</Badge>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đợt đánh giá gần nhất</CardTitle>
          <CardDescription>Danh sách sẽ hiển thị khi kết nối API.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Chưa có dữ liệu.
        </CardContent>
      </Card>
    </div>
  );
}
