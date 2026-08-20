"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ACCOUNTS } from "@/lib/mock/mockUsers";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import type { UserRole } from "@/lib/types/roles";
import type { ApiError } from "@/types/api";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = Object.entries(MOCK_ACCOUNTS).map(([email, account]) => ({
  email,
  password: account.password,
  roleLabel: ROLE_LABEL_VI[account.user.role as UserRole],
}));

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
            placeholder="ten.gv@fe.edu.vn"
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
