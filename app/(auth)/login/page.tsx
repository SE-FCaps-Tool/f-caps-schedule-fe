import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = buildPageMetadata({
  title: "Đăng nhập",
  description: "Đăng nhập hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Dùng tài khoản @fe.edu.vn hoặc @fpt.edu.vn của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
