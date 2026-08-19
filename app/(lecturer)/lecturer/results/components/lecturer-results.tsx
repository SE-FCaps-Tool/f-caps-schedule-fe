"use client";

import { WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLecturerRemediations } from "@/hooks/lecturer/useLecturerPortal";
import { RemediationTaskRow } from "./remediation-task-row";

export function LecturerResults() {
  const { data: tasks, isLoading, isError } = useLecturerRemediations();
  const pendingCount = (tasks ?? []).filter((t) => t.status === "PENDING").length;

  return (
    <div>
      <div className="motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">Khắc phục</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0 ? (
            <>
              <span className="font-medium text-primary">{pendingCount} nhóm</span> chờ xác nhận khắc phục
            </>
          ) : (
            "Không có case khắc phục nào đang chờ xác nhận."
          )}
        </p>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được danh sách khắc phục. Thử tải lại trang.
          </div>
        )}
        {tasks && tasks.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Chưa có case khắc phục nào.</p>
        )}
        {tasks && tasks.length > 0 && (
          <div>
            {tasks.map((task) => (
              <RemediationTaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
