import type { Metadata } from "next";
import { Suspense } from "react";
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
        Dùng tài khoản đã được cấp hoặc đăng nhập với Google.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-12" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
