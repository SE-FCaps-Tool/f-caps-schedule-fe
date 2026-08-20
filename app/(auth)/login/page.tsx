import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LoginForm } from "./login-form";

export const metadata: Metadata = buildPageMetadata({
  title: "Đăng nhập",
  description: "Đăng nhập hệ thống xếp lịch & quản lý đánh giá đồ án tốt nghiệp.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-foreground">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dùng tài khoản @fe.edu.vn hoặc @fpt.edu.vn của bạn.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
