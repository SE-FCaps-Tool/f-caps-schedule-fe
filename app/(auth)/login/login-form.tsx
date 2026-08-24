"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { fetchAuth } from "@/lib/api/services/fetchAuth";
import { MOCK_ACCOUNTS } from "@/lib/mock/mockUsers";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import type { UserRole } from "@/lib/types/roles";
import type { ApiError } from "@/types/api";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.23a4.49 4.49 0 0 1-1.94 2.95v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.43Z" />
      <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.7Z" />
      <path fill="#FBBC05" d="M6.53 13.78a5.86 5.86 0 0 1 0-3.56V7.69H3.29a9.75 9.75 0 0 0 0 8.62l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.3 12 2.3a9.75 9.75 0 0 0-8.71 5.39l3.24 2.53C7.3 7.91 9.46 6.19 12 6.19Z" />
    </svg>
  );
}

const DEMO_ACCOUNTS = Object.entries(MOCK_ACCOUNTS).map(([email, account]) => ({
  email,
  password: account.password,
  roleLabel: ROLE_LABEL_VI[account.user.role as UserRole],
}));

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const oauthError = useSearchParams().get("oauth_error");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(values);
    } catch (error) {
      setSubmitError((error as ApiError)?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="group relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className="rounded-xl border-transparent bg-muted/60 pl-9 transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-primary/15"
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="group relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="rounded-xl border-transparent bg-muted/60 pl-9 transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-primary/15"
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button
        type="submit"
        className="w-full shadow-[0_8px_20px_-8px_var(--brand-orange)] transition-shadow hover:shadow-[0_10px_24px_-6px_var(--brand-orange)]"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        Đăng nhập
      </Button>

      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 border-t border-border" />
        <span className="relative bg-background px-3 text-xs text-muted-foreground">hoặc</span>
      </div>

      {oauthError && (
        <p className="text-sm text-destructive">
          {oauthError === "account_not_provisioned"
            ? "Email Google chưa được cấp tài khoản. Vui lòng liên hệ quản trị viên."
            : "Đăng nhập Google không thành công. Vui lòng thử lại."}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        disabled={isLoading || isGoogleLoading}
        onClick={() => {
          setIsGoogleLoading(true);
          window.location.assign(fetchAuth.googleLoginUrl());
        }}
      >
        {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleLogo />}
        Đăng nhập với Google
      </Button>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">
          Tài khoản demo (chưa nối backend)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setValue("email", account.email, { shouldValidate: true });
                setValue("password", account.password, { shouldValidate: true });
              }}
            >
              {account.roleLabel}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
