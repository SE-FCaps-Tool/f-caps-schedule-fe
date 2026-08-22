"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteCommittee } from "@/hooks/useCommittees";
import type { Committee } from "@/lib/api/services/fetchCommittees";

export function DeleteCommitteeDialog({
  committee,
  open,
  onOpenChange,
}: {
  committee: Committee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useDeleteCommittee();

  function handleDelete() {
    if (!committee) return;
    mutate(committee.id, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Trash2} iconTone="destructive">
          <DialogTitle>Xoá hội đồng?</DialogTitle>
          <DialogDescription>
            “{committee?.code}” và toàn bộ {committee?.memberCount} thành viên sẽ bị xoá vĩnh
            viễn. Không thể hoàn tác. Đây chỉ là danh mục nháp — hội đồng đã gắn vào Round không bị
            ảnh hưởng.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xoá..." : "Xoá hội đồng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
