"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ACCOUNTS } from "@/lib/mock/mockUsers";
import { ROLE_LABEL_VI } from "@/lib/utils/roleLabels";
import type { UserRole } from "@/lib/types/roles";

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
      setSubmitError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="ten.gv@fe.edu.vn"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        Đăng nhập
      </Button>

      <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/40 p-3">
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
