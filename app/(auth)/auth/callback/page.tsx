"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    router.replace("/auth/select-role");
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      Đang hoàn tất đăng nhập...
    </div>
  );
}
